import { Injectable } from '@angular/core';
import Reservation from '../models/Reservation';
import {
  ACCESS,
  CHECKER_STATUS_CHECKED,
  CHECKER_STATUS_PENDING,
  COUPON,
  DEFAULT_PREPAID_TYPE,
  DOCUMENT_TYPE_COUPON,
  DOCUMENT_TYPE_UNSUPORTED,
  PAYMENT_STATUS_ERROR,
  PAYMENT_STATUS_FULLY_PAID,
  PAYMENT_STATUS_MASTER,
  PAYMENT_STATUS_PARTIAL,
  PAYMENT_STATUS_PENDING,
  PAYMENT_STATUS_PREPAID,
  PAYMENT_STATUS_ROUTED,
  PAYMENT_STATUS_TODAY_PAID,
} from '../const';
import StandardCheckResult from '../models/StandardCheckResult';
import { FrontService } from './front-service';
import AttachedDocuments from '../models/AttachedDocuments';
import { downloaderQueue } from '../utils/queues';
import { lastValueFrom } from 'rxjs';
import Routing from '../models/Routing';

// services
import { LocalDatabaseService } from './local-database.service';
import { DocumentAnalyzerService } from './document-analyzer.service';
import { ReservationService } from './operations/reservation.service';
import { LedgerService } from './operations/ledger.service';
import { PrepaidService } from './operations/prepaid.service';
import Ledger from '../models/Ledger';

@Injectable({
  providedIn: 'root',
})
export class CheckerService {
  constructor(
    private ledgerService: LedgerService,
    private prePaidService: PrepaidService,
    private reservationService: ReservationService,
    private frontService: FrontService,
    private documentAnalyzerService: DocumentAnalyzerService,
    private localDBService: LocalDatabaseService
  ) {}

  public async performChecker(reservations: Reservation[]): Promise<any> {
    // check if is already on cache to start a faster checking
    const cache = await this.localDBService.loadCache();
    const cachedReservations = reservations.filter((reservation) =>
      cache.some((data) => data.reservation.id === reservation.id)
    );

    const notCachedReservations = reservations.filter(
      (reservation) =>
        !cache.some((data) => data.reservation.id === reservation.id)
    );

    // check not cached reservations
    const getNotCachedResults = async () => {
      const loadReservationDataPromises = notCachedReservations.map(
        (reservation) => {
          return this.collectReservationData(reservation);
        }
      );
      const loadedReservations = await Promise.all(loadReservationDataPromises);
      const collectedData = loadedReservations.map(
        (data: any, index: number) => {
          return { reservation: reservations[index], data };
        }
      );
      const checkPromises = collectedData.map((data: any) => {
        return this.startStandardCheck(data.reservation, data.data);
      });
      const checkResults = await Promise.all(checkPromises);
      return checkResults;
    };

    // check cached reservations
    const getCachedResults = async () => {
      const fastCheckResultsPromises = cachedReservations.map((reservation) => {
        const loadedCache =
          cache.find((data) => data.reservation.id === reservation.id) || null;
        return this.startCachedCheck(reservation, loadedCache);
      });

      const fastCheckResults = await Promise.all(fastCheckResultsPromises);
      return fastCheckResults;
    };

    const notCachedResults = await getNotCachedResults();
    const cachedResults = await getCachedResults();

    return { newData: notCachedResults, updated: cachedResults };
  }

  private async startCachedCheck(
    reservation: Reservation,
    cache: StandardCheckResult | null
  ): Promise<any> {
    if (!cache) {
      return {
        errors: ['Cache not found. Please, verify.'],
      };
    }
    let cachedCheckResult = {
      reservation: reservation,
      updates: {},
    };

    let updates: any = {};
    const documents = await this.reservationService.getAttachedDocuments(
      reservation.id
    );

    if (documents.length > cache.documents.length) {
      // download new documents & update them
      const newDocuments = documents.slice(
        cache.documents.length,
        documents.length
      );
      const { successfulDownloads, errorDownloads } =
        await this.downloadAttachedDocuments(newDocuments);

      if (successfulDownloads.length > 0) {
        const classifiedDocuments = await this.classifyDocuments(
          successfulDownloads
        );

        const { unsupported, coupons } = classifiedDocuments;

        if (coupons.length > 0) {
          // read & extract coupons data
          const detailedCoupons = coupons.map((coupon: any) => {
            const extraction = this.documentAnalyzerService.extract(
              coupon.provider,
              coupon.text
            );
            return {
              ...coupon,
              extraction,
            };
          });

          // compare coupon data to reservation data
          const comparations = detailedCoupons.map((coupon: any) => {
            const comparation = this.documentAnalyzerService.compare(
              reservation,
              coupon.extraction
            );
            return {
              ...coupon,
              comparation,
            };
          });

          updates.newCoupons = [
            ...comparations.map((couponData: any, index: number) => {
              return {
                sourceReservation: reservation.id,
                error: couponData.error,
                extraction: couponData.extraction,
                comparation: couponData.comparation,
                provider: couponData.provider,
                type: couponData.type,
                priority: coupons[index].provider === ACCESS ? 1 : 2,
              };
            }),
          ];
        }
      }

      updates.documents = documents;
    }

    // get ledgers to search for new charges or payments
    const ledgers = await this.getReservationLedgersAndTransactions(
      reservation
    );
    const updatedLedgers = ledgers.filter((ledger) => {
      const hasUpdates = ledger.transactions.find((trans) => {
        const dateTimestamp = (trans.date as Date).getTime() | 0;
        if (dateTimestamp > cache.lastCheck.getTime()) {
          return trans;
        }

        return null;
      });
      return hasUpdates ? ledger : null;
    });

    updates.ledgers = [...updatedLedgers];
    cachedCheckResult.updates = updates;
    return cachedCheckResult;
  }

  private async startStandardCheck(
    reservation: Reservation,
    collectedData: any
  ): Promise<StandardCheckResult> {
    let checkResult: StandardCheckResult = {
      reservation,
      checkStatus: CHECKER_STATUS_PENDING,
      paymentStatus: PAYMENT_STATUS_PENDING,
      documents: [],
      ledgersStatus: null,
      lastCheck: new Date(),
    };

    const { documents, ledgers, prePaidMethod, routings } = collectedData;

    // if has documents, classify them
    if (documents && documents.length > 0) {
      const { successfulDownloads, errorDownloads } =
        await this.downloadAttachedDocuments(documents);

      if (successfulDownloads.length > 0) {
        const classifiedDocuments = await this.classifyDocuments(
          successfulDownloads
        );

        const { unsupported, coupons } = classifiedDocuments;

        // read & extract coupons data
        const detailedCoupons = coupons.map((coupon: any) => {
          const extraction = this.documentAnalyzerService.extract(
            coupon.provider,
            coupon.text
          );
          return {
            ...coupon,
            extraction,
          };
        });

        // compare coupon data to reservation data
        const comparations = detailedCoupons.map((coupon: any) => {
          const comparation = this.documentAnalyzerService.compare(
            reservation,
            coupon.extraction
          );
          return {
            ...coupon,
            comparation,
          };
        });

        checkResult.activeCoupons = comparations.map(
          (couponData: any, index: number) => {
            return {
              sourceReservation: reservation.id,
              error: couponData.error,
              extraction: couponData.extraction,
              comparation: couponData.comparation,
              provider: couponData.provider,
              type: couponData.type,
              priority: coupons[index].provider === ACCESS ? 1 : 2,
            };
          }
        );
      }

      checkResult.documents = documents;
    }

    // check ledgers
    const ledgerCheck = await this.ledgerService.checkLedgers(
      ledgers,
      reservation.id
    );

    checkResult.ledgersStatus = ledgerCheck;

    if (prePaidMethod.type !== DEFAULT_PREPAID_TYPE) {
      checkResult.prePaidMethod = prePaidMethod;
      checkResult.paymentStatus = PAYMENT_STATUS_PREPAID;
      const [year, month, day] = reservation.dateOut.split('/').map(Number);
      const dateOut = new Date(year, month - 1, day);
      checkResult.checkAgainAt = dateOut;
    }

    if (checkResult.activeCoupons && checkResult.activeCoupons.length > 0) {
      const mainCoupon = checkResult.activeCoupons.reduce((max, coupon) =>
        coupon.overallSimilarity > max.overallSimilarity ? coupon : max
      );
      if (mainCoupon) {
        checkResult.paymentStatus = PAYMENT_STATUS_PREPAID;
        checkResult.prePaidMethod = {
          type: COUPON,
          data: {
            sourceReservation: mainCoupon.sourceReservation,
            provider: mainCoupon.provider,
            isValid: true,
            couponExtraction: mainCoupon.extraction,
            comparation: mainCoupon.comparation,
            priority: mainCoupon.priority,
          },
        };
        const [year, month, day] = reservation.dateOut.split('/').map(Number);
        const dateOut = new Date(year, month - 1, day);
        checkResult.checkAgainAt = dateOut;
      }
    }

    const {
      errors,
      error,
      isFullyPaid,
      isTodayPaid,
      isPendingToPay,
      isPartialPay,
    } = ledgerCheck;

    if (isPendingToPay && !checkResult.prePaidMethod) {
      checkResult.paymentStatus = PAYMENT_STATUS_PENDING;
      checkResult.checkAgainAt = new Date();
    }

    if (isTodayPaid && !checkResult.prePaidMethod) {
      checkResult.paymentStatus = PAYMENT_STATUS_TODAY_PAID;
      checkResult.checkAgainAt = new Date()
        .setDate(new Date().getDate() + 1)
        .toString();
    }

    if (isPartialPay && !checkResult.prePaidMethod) {
      checkResult.paymentStatus = PAYMENT_STATUS_PARTIAL;
    }

    if (isFullyPaid && !checkResult.prePaidMethod) {
      checkResult.paymentStatus = PAYMENT_STATUS_FULLY_PAID;
      const [year, month, day] = reservation.dateOut.split('/').map(Number);
      const dateOut = new Date(year, month - 1, day);
      checkResult.checkAgainAt = dateOut;
    }

    if (routings.length > 0) {
      const routing = routings[0];
      checkResult.routing = routing;
      const routingCheck = await this.checkRouting(routing);
      // only check if is parent
      if (routingCheck.valid && checkResult.routing && routing.isParent) {
        checkResult.paymentStatus = PAYMENT_STATUS_FULLY_PAID;
        checkResult.routing.check = {
          diff: routingCheck.diff,
          totalPaid: routingCheck.totalPaymentsSum,
          totalToPay: routingCheck.totalToPay,
          success: routingCheck.valid,
          errors: routingCheck.errors,
        };
      }

      if (routing.isRouted) {
        checkResult.paymentStatus = PAYMENT_STATUS_FULLY_PAID;
      }
      checkResult.checkAgainAt = reservation.dateOut;
    }

    checkResult.checkStatus = CHECKER_STATUS_CHECKED;
    return checkResult;
  }

  private async downloadAttachedDocuments(
    documents: AttachedDocuments[]
  ): Promise<any> {
    const downloadPromises = documents.map((document) =>
      downloaderQueue.addRequest(async () => {
        return lastValueFrom(
          this.frontService.downloadFile(
            document.downloadUrl,
            `${
              document.sourceId || 'invalid-rsrv-id'
            }-document-${new Date().getTime()}`
          )
        );
      })
    );

    try {
      const downloads = await Promise.all(downloadPromises);

      // classify them
      const successfulDownloads = downloads.filter(
        (download: any) => download.success
      );
      const errorDownloads = downloads.filter(
        (download: any) => !download.success
      );

      return { successfulDownloads, errorDownloads };
    } catch (error) {
      console.log(`Failed downloading attached documents: ${error}`);
      throw new Error(
        error instanceof Error
          ? error.message
          : `Error downloading documents: ${error}`
      );
    }
  }

  // classify documents & compare them with reservation data
  private async classifyDocuments(downloadedDocuments: any[]): Promise<any> {
    const classificationPromises = downloadedDocuments.map((document) =>
      this.documentAnalyzerService.analyze(document.path)
    );

    const classifications = await Promise.all(classificationPromises);
    const unsupported = classifications.filter(
      (classification) => classification.type === DOCUMENT_TYPE_UNSUPORTED
    );
    const coupons = classifications.filter(
      (classification) => classification.type === DOCUMENT_TYPE_COUPON
    );

    return { unsupported, coupons };
  }

  private async getReservationLedgersAndTransactions(
    reservation: Reservation
  ): Promise<Ledger[]> {
    // load reservation ledgers
    const ledgers = await this.ledgerService.getReservationledger(
      reservation.id
    );
    reservation.ledgers = ledgers;

    // load ledgers transactions
    const ledgerTransactionsPromises = ledgers.map((ledger) => {
      return this.ledgerService.getLedgerTransactions(ledger);
    });

    const transactions = await Promise.all(ledgerTransactionsPromises);
    ledgers.forEach((ledger, index) => {
      ledger.transactions = transactions[index];
    });

    return ledgers;
  }

  private async collectReservationData(reservation: Reservation): Promise<any> {
    // load reservation ledgers & transactions
    const ledgers = await this.getReservationLedgersAndTransactions(
      reservation
    );

    // search for pre-paid method
    const prePaidMethod = await this.prePaidService.getPrePaidMethod(
      reservation.id
    );

    // search for reservation attached documents
    const documents = await this.reservationService.getAttachedDocuments(
      reservation.id
    );

    // search for routings
    const routings = await this.reservationService.getRouting(reservation);

    return {
      ledgers,
      prePaidMethod,
      documents,
      routings,
    };
  }

  private async checkRouting(routing: Routing): Promise<any> {
    let routingCheckResult: any = {
      totalToPay: 0,
      totalPaymentsSum: 0,
      valid: false,
      diff: 0,
      errors: [],
    };

    const reservations = await this.reservationService.getInHouseReservations();
    const master = reservations.find(
      (reservation) => reservation.id === routing.parentId
    );
    const childs = reservations.filter((reservation) =>
      routing.childs?.includes(reservation.id)
    );

    if (!master) {
      routingCheckResult.errors.push('Master reservation not found.');
      return routingCheckResult;
    }

    if (!childs || childs.length === 0) {
      routingCheckResult.errors.push('Routing child reservations not found.');
      return routingCheckResult;
    }

    // get total payment in master reservation
    const masterLedgers = await this.ledgerService.getReservationledger(
      master.id
    );

    const targetLedger = masterLedgers.find(
      (ledger) => ledger.ledgerNo === routing.parentLedgerTarget
    );
    if (!targetLedger) {
      routingCheckResult.errors.push('Routing target ledger not found.');
      return routingCheckResult;
    }

    const targetLedgerTransactions =
      await this.ledgerService.getLedgerTransactions(targetLedger);

    const paymentSum = targetLedgerTransactions.reduce((accum, current) => {
      if (current.type === 'PAYMENT') {
        return (accum += Math.abs(current.amount));
      }
      return accum;
    }, 0);

    // get total from each reservation
    let totalToPay = 0;
    let childsTotalSum = 0;

    const masterRates = await this.reservationService.getReservationRates(
      master.id
    );
    const masterTotalToPay = masterRates.reduce((accum, current) => {
      return (accum += current.amount);
    }, 0);
    totalToPay += masterTotalToPay;

    for (const child of routing.childs || []) {
      const rates = await this.reservationService.getReservationRates(child);
      childsTotalSum += rates.reduce((accum, current) => {
        return (accum += Math.abs(current.amount));
      }, 0);
    }

    totalToPay += childsTotalSum;

    routingCheckResult.totalToPay = totalToPay;
    routingCheckResult.totalPaymentsSum = paymentSum;
    let diff = Number(
      parseFloat((paymentSum - totalToPay).toString()).toFixed(2)
    );
    if (diff === 0) {
      routingCheckResult.valid = true;
    }

    if (diff > 0) {
      routingCheckResult.valid = true;
      routingCheckResult.errors.push(
        `Routing payment exceed total to pay by: $${diff}`
      );
    }

    if (diff < 0) {
      routingCheckResult.valid = false;
      routingCheckResult.errors.push(
        `Routing payment is not completed. Pending amount: $${diff}`
      );
    }

    routingCheckResult.diff = diff;
    return routingCheckResult;
  }
}

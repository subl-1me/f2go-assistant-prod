import { Injectable } from '@angular/core';
import Reservation from '../models/Reservation';
import { LedgerService } from './operations/ledger.service';
import { PrepaidService } from './operations/prepaid.service';
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
  PAYMENT_STATUS_PARTIAL,
  PAYMENT_STATUS_PENDING,
  PAYMENT_STATUS_PREPAID,
  PAYMENT_STATUS_TODAY_PAID,
} from '../const';
import { ReservationService } from './operations/reservation.service';
import StandardCheckResult from '../models/StandardCheckResult';
import { FrontService } from './front-service';
import AttachedDocuments from '../models/AttachedDocuments';
import { DocumentAnalyzerService } from './document-analyzer.service';
import { downloaderQueue } from '../utils/queues';
import { LocalDatabaseService } from './local-database.service';
import { lastValueFrom } from 'rxjs';
import CouponDataExtraction from '../shared/coupon-extractions';
import Comparation from '../models/Comparation';

@Injectable({
  providedIn: 'root',
})
export class CheckerService {
  constructor(
    private ledgerService: LedgerService,
    private prePaidService: PrepaidService,
    private reservationService: ReservationService,
    private frontService: FrontService,
    private documentAnalyzerService: DocumentAnalyzerService
  ) {}

  public async performChecker(reservations: Reservation[]): Promise<any> {
    // create DB to save local cache

    // first load reservation ledgers, documents, VCC, notes, rates & helpful stuff

    const loadReservationDataPromises = reservations.map((reservation) => {
      return this.collectReservationData(reservation);
    });

    const loadedReservations = await Promise.all(loadReservationDataPromises);

    const collectedData = loadedReservations.map((data: any, index: number) => {
      return { reservation: reservations[index], data };
    });

    const checkPromises = collectedData.map((data: any) => {
      return this.startStandardCheck(data.reservation, data.data);
    });

    const checkResults = await Promise.all(checkPromises);
    return { status: 200, message: 'OK', checkResults };
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

    const { documents, ledgers, prePaidMethod } = collectedData;

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

  private async collectReservationData(reservation: Reservation): Promise<any> {
    // load reservation ledgers
    const ledgers = await this.ledgerService.getReservationledger(
      reservation.id
    );

    // load ledgers transactions
    const ledgerTransactionsPromises = ledgers.map((ledger) => {
      return this.ledgerService.getLedgerTransactions(ledger);
    });

    const transactions = await Promise.all(ledgerTransactionsPromises);
    ledgers.forEach((ledger, index) => {
      ledger.transactions = transactions[index];
    });

    // search for pre-paid method
    const prePaidMethod = await this.prePaidService.getPrePaidMethod(
      reservation.id
    );

    // search for reservation attached documents
    const documents = await this.reservationService.getAttachedDocuments(
      reservation.id
    );

    return {
      ledgers,
      prePaidMethod,
      documents,
    };
  }
}

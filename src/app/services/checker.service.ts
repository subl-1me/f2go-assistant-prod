import { Injectable } from '@angular/core';
import Reservation from '../models/Reservation';
import { LedgerService } from './operations/ledger.service';
import { PrepaidService } from './operations/prepaid.service';
import {
  CHECKER_STATUS_CHECKED,
  CHECKER_STATUS_PENDING,
  COUPON,
  DEFAULT_PREPAID_TYPE,
  DOCUMENT_TYPE_COUPON,
  DOCUMENT_TYPE_UNSUPORTED,
  PAYMENT_STATUS_ERROR,
  PAYMENT_STATUS_PENDING,
  PAYMENT_STATUS_PREPAID,
} from '../const';
import { ReservationService } from './operations/reservation.service';
import StandardCheckResult from '../models/StandardCheckResult';
import { FrontService } from './front-service';
import AttachedDocuments from '../models/AttachedDocuments';
import { forkJoin, lastValueFrom } from 'rxjs';
import { DocumentAnalyzerService } from './document-analyzer.service';

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
    // first load reservation ledgers, documents, VCC, notes, rates & helpful stuff
    const loadReservationDataPromises = reservations.map((reservation) => {
      return this.collectReservationData(reservation);
    });

    const loadedReservations = await Promise.all(loadReservationDataPromises);
    const collectedData = loadedReservations.map((data, index) => {
      return { reservation: reservations[index], data };
    });

    const checkPromises = collectedData.map((collectedData) =>
      this.startStandardCheck(collectedData)
    );

    const checkResults = await Promise.all(checkPromises);
    return { status: 200, message: 'OK', checkResults };
  }

  private async startStandardCheck(
    collectedData: any
  ): Promise<StandardCheckResult> {
    let checkResult: StandardCheckResult = {
      reservation: collectedData.reservation,
      checkStatus: CHECKER_STATUS_PENDING,
      paymentStatus: PAYMENT_STATUS_PENDING,
      documents: [],
      ledgers: [],
      lastCheck: new Date(),
    };

    const { data, reservation } = collectedData;
    const { ledgers, prePaidMethod, documents } = data;

    if (prePaidMethod.type !== DEFAULT_PREPAID_TYPE) {
      checkResult.prePaidMethod = prePaidMethod;
      checkResult.paymentStatus = PAYMENT_STATUS_PREPAID;
      checkResult.ledgers = ledgers;
      checkResult.checkStatus = CHECKER_STATUS_CHECKED;
      checkResult.checkAgainAt = new Date(reservation.dateOut);
    }

    // if has documents, classify them
    if (documents && documents.length > 0) {
      const { successfulDownloads, errorDownloads } =
        await this.downloadAttachedDocuments(documents);

      if (successfulDownloads.length > 0) {
        const classifiedDocuments = await this.classifyDocuments(
          successfulDownloads
        );

        const { unsupported, coupons } = classifiedDocuments;
        if (coupons.length > 0) {
          // find main coupon
          const { validCoupons, invalidCoupons, mainCoupon } =
            await this.getMainCoupon(coupons, collectedData.reservation);

          if (mainCoupon) {
            checkResult.paymentStatus = PAYMENT_STATUS_PREPAID;
            checkResult.checkStatus = CHECKER_STATUS_CHECKED;
            checkResult.checkAgainAt = new Date(reservation.dateOut);
            checkResult.prePaidMethod = {
              type: COUPON,
              data: {
                type: COUPON,
                provider: mainCoupon.provider,
                isValid: true,
                sourceReservation: reservation.id,
                comparation: mainCoupon.comparation,
              },
            };
          } else {
            checkResult.paymentStatus = PAYMENT_STATUS_ERROR;
          }
        }

        checkResult.documents.push(...unsupported);
      }
    }

    return checkResult;
  }

  private async downloadAttachedDocuments(documents: AttachedDocuments[]) {
    const downloadPromises = documents.map((document) =>
      this.frontService.downloadFile(
        document.downloadUrl,
        `${
          document.sourceId || 'invalid-rsrv-id'
        }-document-${new Date().getTime()}`
      )
    );

    const downloadResults = await Promise.all(downloadPromises);
    const downloads = await lastValueFrom(forkJoin(downloadResults));

    // classify them
    const successfulDownloads = downloads.filter(
      (download) => download.success
    );
    const errorDownloads = downloads.filter((download) => !download.success);

    return { successfulDownloads, errorDownloads };
  }

  private async getMainCoupon(
    coupons: any[],
    reservation: Reservation
  ): Promise<any> {
    // compare each coupon with reservation data
    const couponPromises = coupons.map((coupon) =>
      this.documentAnalyzerService.compare(reservation, coupon.data)
    );
    const couponResults = await Promise.all(couponPromises);

    // best similarity is 0.8
    // filter coupons with similarity >= 0.8
    const validCoupons = couponResults
      .filter((result) => result.overallSimilarity >= 0.8)
      .map((comparation, index) => {
        return {
          provider: coupons[index].provider,
          isValid: true,
          sourceReservation: reservation.id,
          comparation: comparation,
        };
      });

    const invalidCoupons = couponResults.filter(
      (result) => result.overallSimilarity < 0.8
    );

    return {
      validCoupons,
      invalidCoupons,
      mainCoupon: validCoupons[0] || null,
    };
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

    // load transaction for each ledger
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

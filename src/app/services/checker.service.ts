import { Injectable } from '@angular/core';
import Reservation from '../models/Reservation';
import { LedgerService } from './operations/ledger.service';
import { PrepaidService } from './operations/prepaid.service';
import { DEFAULT_PREPAID_TYPE } from '../const';
import { ReservationService } from './operations/reservation.service';

@Injectable({
  providedIn: 'root',
})
export class CheckerService {
  constructor(
    private ledgerService: LedgerService,
    private prePaidService: PrepaidService,
    private reservationService: ReservationService
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

  private async startStandardCheck(collectedData: any): Promise<any> {
    const { data, reservation } = collectedData;
    const { ledgers, prePaidMethod, documents } = data;
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

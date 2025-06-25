import { Injectable } from '@angular/core';
import Reservation from '../models/Reservation';
import { LedgerService } from './operations/ledger.service';
import { PrepaidService } from './operations/prepaid.service';

@Injectable({
  providedIn: 'root',
})
export class CheckerService {
  constructor(
    private ledgerService: LedgerService,
    private prePaidService: PrepaidService
  ) {}
  public async performChecker(reservations: Reservation[]): Promise<any> {
    // first load reservation ledgers, documents, VCC, notes, rates & helpful stuff
    const loadReservationDataPromises = reservations.map((reservation) => {
      return this.collectReservationData(reservation);
    });

    const loadedReservations = await Promise.all(loadReservationDataPromises);
  }

  private async collectReservationData(reservation: Reservation): Promise<any> {
    // load reservation ledgers
    // const ledgers = await this.ledgerService.getReservationledger(
    //   reservation.id
    // );
    // reservation.ledgers = ledgers;

    // // load ledgers transactions
    // const ledgerTransactionsPromises = ledgers.map((ledger) => {
    //   return this.ledgerService.getLedgerTransactions(ledger);
    // });

    // // load transaction for each ledger
    // const transactions = await Promise.all(ledgerTransactionsPromises);
    // reservation.ledgers.forEach((ledger, index) => {
    //   ledger.transactions = transactions[index];
    // });

    // search for pre-paid method
    const prePaidMethod = await this.prePaidService.getPrePaidMethod(
      reservation.id
    );
  }
}

import { Injectable } from '@angular/core';
import Reservation from '../models/Reservation';
import MarkedReservation from '../models/MarkedReservation';
import { InvoiceService } from './operations/invoice.service';
import { LedgerService } from './operations/ledger.service';

@Injectable({
  providedIn: 'root',
})
export class InvoicerService {
  constructor(
    private invoiceService: InvoiceService,
    private ledgerService: LedgerService
  ) {}

  async performInvoicer(
    reservations: Reservation[],
    markedReservations: MarkedReservation[]
  ): Promise<any> {
    // init invoicer process

    for (const reservation of reservations) {
      const invoices = await this.invoiceService.getReservationInvoices(
        reservation.id
      );

      const ledgers = await this.ledgerService.getReservationledger(
        reservation.id
      );
      const ledgerDistribution = await this.ledgerService.classifyLedgers(
        ledgers
      );
      console.log(ledgerDistribution);
    }
  }
}

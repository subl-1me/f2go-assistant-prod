import { Injectable } from '@angular/core';
import Reservation from '../models/Reservation';
import MarkedReservation from '../models/MarkedReservation';

@Injectable({
  providedIn: 'root',
})
export class InvoicerService {
  constructor() {}

  async performInvoicer(
    reservations: Reservation[],
    markedReservations: MarkedReservation[]
  ): Promise<any> {
    // init invoicer process
  }
}

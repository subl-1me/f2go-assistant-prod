import { Injectable } from '@angular/core';
import Reservation from '../../models/Reservation';
import { environment } from '../../../environment';
import { FrontService } from '../front-service';
import { HttpParams } from '@angular/common/http';
import NotesByUser from '../../models/NotesByUser';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  constructor(private frontService: FrontService) {}

  public async getChinList(): Promise<Reservation[]> {
    return [];
  }

  public async getArrivals(): Promise<Reservation[]> {
    return [];
  }

  public async getChoutList(): Promise<Reservation[]> {
    return [];
  }

  public async getReservationNotes(
    reservationId: string
  ): Promise<NotesByUser[]> {
    const params = new HttpParams()
      .set('rsrv', reservationId)
      .set('hotel', environment.PROP_NAME)
      .set('hist', 0) // default
      .set('rows', 10) // default
      .set('page', 1); // default

    return new Promise<NotesByUser[]>((resolve, reject) => {
      this.frontService
        .getRequest(environment.FRONT_API_GET_RSRV_NOTES, params)
        .subscribe((response) => {
          console.log(response);
          if (response.status === 401) {
            reject('Authentication error. Please, log in again.');
          }

          const data = JSON.parse(response);
          const rows = data.rows;

          resolve(
            rows.map((item: any) => {
              // clean raw notes
              let rawNotes = JSON.parse(item.guenoNotes) || [];
              let notes = rawNotes.map((note: any) => {
                return note.text.toUpperCase();
              });

              return {
                reservationId,
                notes,
                id: item.guenoId,
                type: item.guenoType,
                user: item.guenoUser,
                createdAt: item.guenoCreate,
              };
            })
          );
        });
    });
  }
}

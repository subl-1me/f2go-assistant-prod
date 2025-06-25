import { Injectable } from '@angular/core';
import Reservation from '../../models/Reservation';
import { environment } from '../../../environment';
import { FrontService } from '../front-service';
import { HttpParams } from '@angular/common/http';
import NotesByUser from '../../models/NotesByUser';
import { lastValueFrom, map } from 'rxjs';
import Extractor from '../../Extractor';
import AttachedDocuments from '../../models/AttachedDocuments';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private extractor: Extractor;

  constructor(private frontService: FrontService) {
    this.extractor = new Extractor();
  }

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

  public async getAttachedDocuments(
    reservationId: string
  ): Promise<AttachedDocuments[]> {
    const params = new HttpParams()
      .set('hdnVenClose', 'menu') // default
      .set('reservacionid', reservationId)
      .set('Hist', '0'); // default

    try {
      const response = await lastValueFrom(
        this.frontService
          .getRequest(environment.FRONT_API_GET_RSRV_ATTACHED_DOCS, params)
          .pipe(
            map((response) => {
              console.log(response);
              if (!response.rawData) {
                return [];
              }

              const rawDocs = this.extractor.extractAttachedDocsData(
                response.rawData
              );
              if (rawDocs.length === 0) {
                return [];
              }

              return rawDocs.map((doc: any) => {
                return {
                  id: doc.id,
                  type: doc.type,
                  downloadUrl: environment.FRONT_API_DOC_DOWNLOAD_URL.replace(
                    '{docIdField}',
                    doc.id
                  ).replace('{rsrvIdField}', reservationId),
                };
              });
            })
          )
      );

      return response;
    } catch (err) {
      console.log(err);
      return [];
    }
  }
}

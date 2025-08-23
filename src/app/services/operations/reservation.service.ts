import { Injectable } from '@angular/core';
import Reservation from '../../models/Reservation';
import { environment } from '../../../environment';
import { FrontService } from '../front-service';
import { HttpParams } from '@angular/common/http';
import NotesByUser from '../../models/NotesByUser';
import Extractor from '../../Extractor';
import AttachedDocuments from '../../models/AttachedDocuments';
import Rate from '../../models/Rate';
import { PAYLOAD_STATUS_CHIN, ROOM_TYPES } from '../../const';
import { RequestQueueService } from '../request-queue.service';
import { defaultQueue } from '../../utils/queues';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private extractor: Extractor;
  private requestQueueu = RequestQueueService.getInstance();

  constructor(private frontService: FrontService) {
    this.extractor = new Extractor();
  }

  public async getInHouseReservations(): Promise<Reservation[]> {
    const payload = {
      pc: environment.HDN_001 || '',
      ph: false,
      pn: '',
      ci: '',
      gpi: '',
      ti: '',
      rc: '',
      rm: '',
      fm: '',
      to: '',
      fq: '',
      rs: PAYLOAD_STATUS_CHIN,
      st: 'EC',
      grp: '',
      gs: '',
      sidx: 'NameGuest',
      sord: 'asc',
      rows: 120,
      page: 1,
      ss: false,
      rcss: '',
      user: 'HTJUGALDEA',
      AddGuest: false,
    };

    const task = async () => {
      return new Promise((resolve, reject) => {
        this.frontService
          .postRequest(
            environment.FRONT_API_GET_RESERVATION_LIST,
            payload,
            true
          )
          .subscribe({
            next: (response) => {
              const data = JSON.parse(response);
              let reservations: Reservation[] = [
                ...data.rows.map((item: any) => {
                  return {
                    id: item.rsrvCode,
                    marriotId: '',
                    guestName: item.nameGuest,
                    room: item.room,
                    roomType: item.roomDescription.includes(
                      ROOM_TYPES.forEach((type) => type)
                    ),
                    dateIn: item.dateIn,
                    dateOut: item.dateOut,
                    status: item.statusGuest.trim(),
                    numberOfGuests: Number(item.peopleNo),
                    company: item.company,
                    agency: item.agency,
                    membership: item.freqTvl,
                  };
                }),
              ];

              resolve({
                error: false,
                reservations,
              });
            },
            error: (error) => {
              reject(error);
            },
          });
      });
    };

    try {
      const taskResult = await defaultQueue.addRequest(task);
      if (taskResult.error || !taskResult.reservations) {
        return [];
      }

      return taskResult.reservations;
    } catch (err) {
      console.log('Failed to fetch in house reservations.');
      return [];
    }
  }

  public async getArrivals(): Promise<Reservation[]> {
    return [];
  }

  public async getChoutList(): Promise<Reservation[]> {
    return [];
  }

  public async getReservationRates(reservationId: string): Promise<Rate[]> {
    let rates: Rate[] = [];
    const rateCode = await this.getReservationRateCode(reservationId);
    if (!rateCode || rateCode === '') {
      return rates;
    }

    const ratesPayload = {
      historico: false,
      pkg: false,
      prop_code: environment.PROP_NAME,
      rate_code: rateCode,
      rsrv_code: reservationId,
      rsrv_status: 'CHIN',
    };

    const task = async () => {
      return new Promise((resolve, reject) => {
        this.frontService
          .postRequest(
            environment.FRONT_API_GET_RESERVATION_RATES,
            ratesPayload
          )
          .subscribe({
            next: (response) => {
              rates = JSON.parse(response).map((rate: any) => {
                return {
                  amount: rate.totalAmount,
                  tax: rate.tax,
                  code: rate.rateCode,
                  date: rate.dateRate.trim(),
                  currency: rate.currency.trim(),
                } as Rate;
              });
              resolve(rates);
            },
            error: (err) => {
              reject(rates);
            },
          });
      });
    };

    try {
      const rates = await defaultQueue.addRequest(task);
      return rates;
    } catch (error) {
      console.log(`Failed fetching reservation rates: ${error}`);
      return [];
    }
  }

  public async getReservationRateCode(reservationId: string): Promise<string> {
    let rateCode = '';
    const FRONT_API_GET_RATE_CODE_MODIFIED =
      environment.FRONT_API_RESERVATION_GET_RATE_CODE.replace(
        '{rsrvId}',
        reservationId
      );

    const task = async () => {
      return new Promise((resolve, reject) => {
        this.frontService
          .getRequest(FRONT_API_GET_RATE_CODE_MODIFIED)
          .subscribe({
            next: (response) => {
              rateCode = this.extractor.extractRateCode(response.rawData);
              resolve(rateCode);
            },
            error: (err) => {
              reject(err);
            },
          });
      });
    };

    try {
      const rateCode = await defaultQueue.addRequest(task);
      return rateCode;
    } catch (error) {
      return rateCode;
    }
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

    const task = async () => {
      return new Promise((resolve, reject) => {
        this.frontService
          .getRequest(environment.FRONT_API_GET_RSRV_ATTACHED_DOCS, params)
          .subscribe({
            next: (response) => {
              if (!response.rawData) {
                resolve([]);
              }

              const rawDocs = this.extractor.extractAttachedDocsData(
                response.rawData
              );
              if (rawDocs.length === 0) {
                resolve([]);
              }

              resolve(
                rawDocs.map((doc: any) => {
                  return {
                    id: doc.id,
                    type: doc.type,
                    downloadUrl: environment.FRONT_API_DOC_DOWNLOAD_URL.replace(
                      '{docIdField}',
                      doc.id
                    ).replace('{rsrvIdField}', reservationId),
                    sourceId: reservationId,
                  } as AttachedDocuments;
                })
              );
            },
            error: (error) => {
              reject(error);
            },
          });
      });
    };

    try {
      const documents = await defaultQueue.addRequest(task);
      return documents;
    } catch (error) {
      console.log(`Failed to fetch reservation documents: ${error}`);
      return [];
    }
  }
}

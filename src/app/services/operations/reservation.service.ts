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
import { defaultQueue } from '../../utils/queues';
import Routing from '../../models/Routing';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private extractor: Extractor;

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

  public async getReservationFacade(
    reservationId: string,
    room: string
  ): Promise<boolean> {
    let formData = new FormData();
    formData.append('_hdn001', environment.HDN_001 || '');
    formData.append('_hdn002', 'false');
    formData.append('_hdn003', environment.HDN_001 || '');
    formData.append('hdnPage', '');
    formData.append('_hdnPropName', environment.HDN_PROP_NAME || '');
    formData.append('_hdnRoleName', 'Recepcion');
    formData.append('_hdnOffset', '-6');
    formData.append('_hdnAppDate', '2025/12/10');
    formData.append('_hdnImgCookie', 'none');
    formData.append('hdnIdiom', 'Spa');
    formData.append('hdnLoadFolio', '');
    formData.append('_hdnRSRV', reservationId);
    formData.append('hdnGetRoom', 'ROOM');
    formData.append('hdnIdRoom', room);
    formData.append('hdnPropCode', environment.PROP_NAME || '');
    formData.append('hdn_Rsrv2', '');
    formData.append('hdn_RPTPortada', '');
    formData.append('hdnGuestFolio', '');
    formData.append('_hdnGroupCode', '');
    formData.append('_hdnNumPage', '');
    formData.append('hdnSetBonusCode', '');
    formData.append(
      '__RequestVerificationToken',
      localStorage.getItem('verificationToken') || ''
    );

    const task = async () => {
      return new Promise((resolve, reject) => {
        this.frontService
          .postRequest(
            environment.FRONT_API_RESERVATION_MAIN_PAGE,
            formData,
            true
          )
          .subscribe({
            next: (_response) => {
              resolve({
                reservationTarget: reservationId,
                roomTarget: room,
                success: true,
              });
            },
            error: (err) => {
              reject(err);
            },
          });
      });
    };

    try {
      const result = await defaultQueue.addRequest(task);
      return result;
    } catch (err) {
      console.log(`Failed to remove room pre-assignment: ${err}`);
      return false;
    }
  }

  public async removeRoomPreassignment(
    reservationId: string,
    room: string
  ): Promise<boolean> {
    let formData = new FormData();
    formData.append('_hdn001', environment.HDN_001 || '');
    formData.append('_hdn002', 'false');
    formData.append('_hdn003', environment.HDN_001 || '');
    formData.append('hdnPage', '');
    formData.append('_hdnPropName', environment.HDN_PROP_NAME || '');
    formData.append('_hdnRoleName', 'Recepcion');
    formData.append('_hdnOffset', '-6');
    formData.append('_hdnAppDate', '2025/12/10');
    formData.append('_hdnImgCookie', 'none');
    formData.append('hdnIdiom', 'Spa');
    formData.append('hdnLoadFolio', '');
    formData.append('_hdnRSRV', reservationId);
    formData.append('hdnGetRoom', '');
    formData.append('hdnIdRoom', '');
    formData.append('hdnPropCode', environment.PROP_NAME || '');
    formData.append('hdn_Rsrv2', '');
    formData.append('hdn_RPTPortada', '');
    formData.append('hdnGuestFolio', '');
    formData.append('_hdnGroupCode', '');
    formData.append('_hdnNumPage', '');
    formData.append('hdnSetBonusCode', '');
    formData.append(
      '__RequestVerificationToken',
      localStorage.getItem('verificationToken') || ''
    );

    const task = async () => {
      return new Promise((resolve, reject) => {
        this.frontService
          .postRequest(
            environment.FRONT_API_RESERVATION_MAIN_PAGE,
            formData,
            true
          )
          .subscribe({
            next: (_response) => {
              resolve({
                reservationTarget: reservationId,
                roomTarget: room,
                success: true,
              });
            },
            error: (err) => {
              reject(err);
            },
          });
      });
    };

    try {
      const result = await defaultQueue.addRequest(task);
      return result;
    } catch (err) {
      console.log(`Failed to remove room pre-assignment: ${err}`);
      return false;
    }
  }

  public async getArrivals(): Promise<Reservation[]> {
    return [];
  }

  public async getChoutList(): Promise<Reservation[]> {
    return [];
  }

  public async getAllHistoricalReservations(): Promise<Reservation[]> {
    const payload = {
      ph: false,
      pc: 'KFwHWn911eaVeJhL++adWg==',
      pn: '',
      ci: '',
      gpi: '',
      ti: '',
      rc: '',
      rm: '',
      fm: '',
      to: '',
      fq: '',
      rs: 'RSRV,CXLD',
      st: 'LL',
      NoPax: '',
      grp: '',
      gs: '',
      sidx: 'NameGuest',
      sord: 'asc',
      rows: 100,
      page: 2,
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
              const rows = JSON.parse(response).rows;
              const reservations: Reservation[] = rows.map((item: any) => {
                return {
                  id: item.rsrvCode,
                  guestName: item.nameGuest,
                  room: item.room,
                  status: item.statusRsv.trim(),
                };
              });
              resolve(reservations);
            },
            error: (err) => {
              reject(err);
            },
          });
      });
    };

    try {
      const reservations = await defaultQueue.addRequest(task);
      return reservations;
    } catch (err) {
      return [];
    }
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

  public async getRouting(reservation: Reservation): Promise<any> {
    const routingTasks = reservation.ledgers?.map((ledger) => {
      return async () => {
        const formData = new FormData();
        formData.append('_hdn001', environment.HDN_001);
        formData.append('_hdn002', 'false');
        formData.append('_hdn003', environment.HDN_001);
        formData.append('_hdnPropName', environment.HDN_PROP_NAME);
        formData.append('_hdnOffset', '-6');
        formData.append('_hdnFiscalName', '');
        formData.append('_hdnRoleName', 'Recepcion');
        formData.append('hdnHasContract', 'False');
        formData.append('hdnGuestCode', reservation.id);
        formData.append('hdnGuestStatus', reservation.reservationStatus);
        formData.append('hdnIdioma', 'Spa');
        formData.append('hdnSafePeople', '');
        formData.append('hdnIsHist', '0');
        formData.append('hdnGuestFolio', ledger.ledgerNo.toString());
        formData.append('_hdnImgCookie', 'none');
        formData.append(
          '__RequestVerificationToken',
          localStorage.getItem('verificationToken') || ''
        );

        try {
          const response = await firstValueFrom(
            this.frontService.postRequest(
              environment.FRONT_API_RSRV_ROUTINGS,
              formData,
              true
            )
          );

          if (typeof response === 'string') {
            return {
              success: false,
              message:
                'Error trying to get reservation routing. Unexpected string instead object.',
            };
          }

          const rawRouting = this.extractor.extractReservationRouting(
            response.rawData
          );
          return rawRouting;
        } catch (err) {
          console.log('Error trying to get reservation routings: ' + err);
          return { success: false, message: err };
        }
      };
    });

    let routings: Routing[] = [];
    try {
      for (const task of routingTasks || []) {
        let routing: Routing = {
          isParent: false,
          parentId: '',
          isRouted: false,
        };

        const routingTaskResults = await defaultQueue.addRequest(task);
        if (routingTaskResults.length === 0) {
          return routing;
        }

        const reference = routingTaskResults[0];
        const parentId = reference.RsrvTarget;
        routing.parentId = parentId;
        routing.parentLedgerTarget =
          Number(reference.FolioTarget.split('.')[1]) || 1;

        if (parentId === reservation.id) {
          routing.isParent = true;
          routing.childs = routingTaskResults.map(
            (rawRouting: any) => rawRouting.RsrvSource
          );
        } else {
          routing.isRouted = true;
        }

        routings.push(routing);
      }
    } catch (err) {
      console.log(err);
      return [];
    }

    return routings;
  }
}

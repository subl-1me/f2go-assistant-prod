import { EnvironmentInjector, Injectable } from '@angular/core';
import { VirtualCreditCard } from '../../models/VirtualCreditCard';
import { DEFAULT_VCC_PROVIDER, DEFAULT_VCC_TYPE } from '../../const';
import { ReservationService } from './reservation.service';
import Extractor from '../../Extractor';
import { FrontService } from '../front-service';
import { environment } from '../../../environment';
import { HttpParams } from '@angular/common/http';
import { catchError, forkJoin, lastValueFrom, map, Observable, of } from 'rxjs';
import AttachedDocuments from '../../models/AttachedDocuments';

@Injectable({
  providedIn: 'root',
})
export class PrepaidService {
  private extractor: Extractor;

  constructor(
    private reservationService: ReservationService,
    private frontService: FrontService
  ) {
    this.extractor = new Extractor();
  }

  async getPrePaidMethod(reservationId: string): Promise<any> {
    // search for virtual card
    // const virtualCreditCard = await this.getVirtualCard(reservationId);

    // // search for certificate
    // const bonvoyCertificateId = await this.getBonvoyCertificateId(
    //   reservationId
    // );

    // search for coupons
    const coupons = await this.getCoupons(reservationId);
    console.log(coupons);
    return;
  }

  private async getVirtualCard(
    reservationId: string
  ): Promise<VirtualCreditCard> {
    let VCC: VirtualCreditCard = {
      provider: DEFAULT_VCC_PROVIDER,
      amount: 0,
      type: DEFAULT_VCC_TYPE,
      readyToCharge: false,
      isValid: false,
    };

    // fetch for data
    const notes = await this.reservationService.getReservationNotes(
      reservationId
    );

    // scrap each note in order to search pattern that indicates reservation has a VCC attached.
    const data = this.extractor.extractVirtualCardData(notes[0]);
    VCC.amount = data.amountToCharge;
    VCC.provider = data.provider;
    VCC.isValid = data.isValid;
    return VCC;
  }

  private async getBonvoyCertificateId(
    reservationId: string
  ): Promise<string | null> {
    const params = new HttpParams()
      .set('guestId', reservationId)
      .set('propcode', environment.PROP_NAME);

    try {
      const response = await lastValueFrom(
        this.frontService
          .getRequest(environment.FRONT_API_GET_RSRV_CERTIFICATE_ID, params)
          .pipe(
            map((response) => {
              if (!response.rawData) {
                return null;
              }
              return this.extractor.extractBonvoyCertificateId(
                response.rawData
              );
            })
          )
      );
      return response;
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  private async getCoupons(reservationId: string): Promise<any> {
    const attachedDocuments: AttachedDocuments[] =
      await this.reservationService.getAttachedDocuments(reservationId);

    console.log(attachedDocuments);
    if (attachedDocuments.length < 0) {
      return [];
    }

    // download each document & analyze them to determine which are coupons
    const downloadDocsPromises = attachedDocuments.map((document) =>
      // this.frontService.postRequest(document.downloadUrl)
      this.frontService.downloadFile(
        document.downloadUrl,
        `${reservationId}-document-${new Date().getTime()}`
      )
    );

    return await lastValueFrom(forkJoin(downloadDocsPromises));
  }
}

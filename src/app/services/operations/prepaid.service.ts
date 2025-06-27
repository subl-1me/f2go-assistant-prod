import { EnvironmentInjector, Injectable } from '@angular/core';
import { VirtualCreditCard } from '../../models/VirtualCreditCard';
import {
  BONVOY_CERTIFICATE,
  COUPON,
  DEFAULT_PREPAID_PROVIDER,
  DEFAULT_PREPAID_TYPE,
  DEFAULT_VCC_PROVIDER,
  DEFAULT_VCC_TYPE,
  VIRTUAL_CREDIT_CARD,
} from '../../const';
import { ReservationService } from './reservation.service';
import Extractor from '../../Extractor';
import { FrontService } from '../front-service';
import { environment } from '../../../environment';
import { HttpParams } from '@angular/common/http';
import { catchError, forkJoin, lastValueFrom, map, Observable, of } from 'rxjs';
import AttachedDocuments from '../../models/AttachedDocuments';
import PrePaidMethod from '../../models/PrePaidMethod';
import BonvoyCertificate from '../../models/BonvoyCertificate';
import Coupon from '../../models/Coupon';

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

  async getPrePaidMethod(reservationId: string): Promise<PrePaidMethod> {
    let prepaidMethod: PrePaidMethod = {
      type: DEFAULT_PREPAID_TYPE,
      data: null,
    };

    const [virtualCreditCard, bonvoyCertificate, coupon] = await Promise.all([
      this.getVirtualCard(reservationId),
      this.getBonvoyCertificateId(reservationId),
      this.getCoupon(reservationId),
    ]);

    if (
      virtualCreditCard.type !== DEFAULT_VCC_PROVIDER &&
      virtualCreditCard.isValid
    ) {
      prepaidMethod.data = virtualCreditCard;
      prepaidMethod.type = VIRTUAL_CREDIT_CARD;
    }

    if (typeof bonvoyCertificate === 'string') {
      prepaidMethod.data = bonvoyCertificate;
      prepaidMethod.type = BONVOY_CERTIFICATE;
    }

    if (coupon.isValid && coupon.provider !== DEFAULT_PREPAID_PROVIDER) {
      prepaidMethod.data = coupon;
      prepaidMethod.type = COUPON;
    }

    return prepaidMethod;
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
  ): Promise<BonvoyCertificate> {
    let bonvoyCertificate: BonvoyCertificate = {
      sourceReservation: reservationId,
      code: null,
    };

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
      bonvoyCertificate.code = response;
      return bonvoyCertificate;
    } catch (err) {
      return bonvoyCertificate;
    }
  }

  private async getCoupon(reservationId: string): Promise<Coupon> {
    let coupon: Coupon = {
      id: null,
      sourceReservation: reservationId,
      filePath: '',
      provider: DEFAULT_PREPAID_PROVIDER,
      isValid: false,
    };

    const attachedDocuments: AttachedDocuments[] =
      await this.reservationService.getAttachedDocuments(reservationId);

    console.log(attachedDocuments);
    if (attachedDocuments.length < 0) {
      return coupon;
    }

    // download each document & analyze them to determine which are coupons
    const downloadDocsPromises = attachedDocuments.map((document) =>
      // this.frontService.postRequest(document.downloadUrl)
      this.frontService.downloadFile(
        document.downloadUrl,
        `${reservationId}-document-${new Date().getTime()}`
      )
    );

    coupon.isValid = true;
    return coupon;
    // return await lastValueFrom(forkJoin(downloadDocsPromises));
  }
}

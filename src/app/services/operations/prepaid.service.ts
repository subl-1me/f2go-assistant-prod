import { Injectable } from '@angular/core';
import { VirtualCreditCard } from '../../models/VirtualCreditCard';
import {
  BONVOY_CERTIFICATE,
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
import { lastValueFrom, map } from 'rxjs';
import { DocumentAnalyzerService } from '../document-analyzer.service';
import PrePaidMethod from '../../models/PrePaidMethod';
import BonvoyCertificate from '../../models/BonvoyCertificate';
import { prePaidQueue } from '../../utils/queues';

@Injectable({
  providedIn: 'root',
})
export class PrepaidService {
  private extractor: Extractor;

  constructor(
    private reservationService: ReservationService,
    private frontService: FrontService,
    private documentAnalyzerService: DocumentAnalyzerService
  ) {
    this.extractor = new Extractor();
  }

  async getPrePaidMethod(reservationId: string): Promise<PrePaidMethod> {
    let prepaidMethod: PrePaidMethod = {
      type: DEFAULT_PREPAID_TYPE,
      data: null,
    };

    try {
      const getVCCTask = prePaidQueue.addRequest(
        async () => await this.getVirtualCard(reservationId)
      );
      const getCertificateTask = prePaidQueue.addRequest(
        async () => await this.getBonvoyCertificateId(reservationId)
      );

      const [VCCData, certificateData] = await Promise.all([
        getVCCTask,
        getCertificateTask,
      ]);

      if (VCCData && VCCData.isValid) {
        prepaidMethod.data = VCCData;
        prepaidMethod.type = VIRTUAL_CREDIT_CARD;
      }

      if (certificateData && certificateData.code !== null) {
        prepaidMethod.data = certificateData;
        prepaidMethod.type = BONVOY_CERTIFICATE;
      }
    } catch (err) {
      console.log(`Failed to fetch prepaid methods: ${err}`);
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
}

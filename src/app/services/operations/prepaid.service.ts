import { Injectable } from '@angular/core';
import { VirtualCreditCard } from '../../models/VirtualCreditCard';
import { DEFAULT_VCC_PROVIDER, DEFAULT_VCC_TYPE } from '../../const';
import { ReservationService } from './reservation.service';
import Extractor from '../../Extractor';

@Injectable({
  providedIn: 'root',
})
export class PrepaidService {
  private extractor: Extractor;

  constructor(private reservationService: ReservationService) {
    this.extractor = new Extractor();
  }

  async getPrePaidMethod(reservationId: string): Promise<any> {
    const virtualCreditCard = await this.getVirtualCard(reservationId);

    return virtualCreditCard;
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
}

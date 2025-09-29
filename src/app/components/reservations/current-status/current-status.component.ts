import { DatePipe, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import StandardCheckResult from '../../../models/StandardCheckResult';
import {
  BONVOY_CERTIFICATE,
  COUPON,
  VIRTUAL_CREDIT_CARD,
  PAYMENT_STATUS_FULLY_PAID,
  PAYMENT_STATUS_TODAY_PAID,
  PAYMENT_STATUS_PENDING,
  PAYMENT_STATUS_PARTIAL,
  PAYMENT_STATUS_ERROR,
  PAYMENT_STATUS_PREPAID,
} from '../../../const';

@Component({
  selector: 'app-current-status',
  imports: [NgIf, DatePipe],
  templateUrl: './current-status.component.html',
  styleUrl: './current-status.component.css',
})
export class CurrentStatusComponent implements OnInit {
  public isLoadingResults: boolean = false;
  public lastCheckerResults: StandardCheckResult[] = [];

  public VIRTUAL_CARD: string = VIRTUAL_CREDIT_CARD;
  public COUPON: string = COUPON;
  public CERTIFICATE: string = BONVOY_CERTIFICATE;

  public PAYMENT_STATUS_DICT = {
    FULLY_PAID: PAYMENT_STATUS_FULLY_PAID,
    TODAY_PAID: PAYMENT_STATUS_TODAY_PAID,
    PENDING: PAYMENT_STATUS_PENDING,
    PARTIAL: PAYMENT_STATUS_PARTIAL,
    ERROR: PAYMENT_STATUS_ERROR,
    PRE_PAID: PAYMENT_STATUS_PREPAID,
  };

  constructor() {}

  async ngOnInit(): Promise<void> {
    await this.loadCache();
  }

  public openCheckResultModal(modalId: string): void {
    const modal = document.getElementById(`check-details-${modalId}`);
    if (!modal) {
      alert(`Error trying to open reservation's modal details.`);
      return;
    }

    modal.classList.remove('hidden');
  }

  public closeCheckResultModal(modalId: string): void {
    const modal = document.getElementById(`check-details-${modalId}`);
    if (!modal) {
      alert(`Error trying to close reservation's modal details.`);
      return;
    }

    modal.classList.add('hidden');
  }

  private async loadCache(): Promise<void> {
    const data = await window.electron.ipcRenderer.invoke('read');
    this.lastCheckerResults = data.map((result: any) => {
      return {
        reservation: JSON.parse(result.reservation),
        documents: JSON.parse(result.documents),
        paymentStatus: result.paymentStatus,
        checkStatus: result.checkStatus,
        lastCheck: result.lastCheck,
        checkAgainAt: result.checkAgainAt,
        prePaidMethod: JSON.parse(result.prePaidMethod),
        activeCoupons: JSON.parse(result.activeCoupons),
        ledgersStatus: JSON.parse(result.ledgersStatus),
      } as StandardCheckResult;
    });
  }
}

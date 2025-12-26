import { DatePipe, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import StandardCheckResult from '../../../models/StandardCheckResult';
import { LocalDatabaseService } from '../../../services/local-database.service';
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

  constructor(private localDBService: LocalDatabaseService) {}

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
    this.lastCheckerResults = await this.localDBService.loadCache();
    console.log(this.lastCheckerResults);
  }

  public async refreshReservationsCache(): Promise<void> {
    return await this.loadCache();
  }

  public async removeCurrentCache(): Promise<void> {
    await window.electron.ipcRenderer.invoke('removeReservationsCache');
    this.lastCheckerResults = [];
  }
}

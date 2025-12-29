import { Component, model, OnInit } from '@angular/core';
import { LocalDatabaseService } from '../../../services/local-database.service';
import StandardCheckResult from '../../../models/StandardCheckResult';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-today-departures',
  imports: [NgIf],
  templateUrl: './today-departures.component.html',
  styleUrl: './today-departures.component.css',
})
export class TodayDeparturesComponent implements OnInit {
  public cache: StandardCheckResult[];
  public isSelectedFiscalCode: boolean;
  public inputFiscalName: string;
  public inputFiscalCode: string;
  public searchResults: any[] = [];
  public preSelectedInvoiceData: any = null;

  public invoicesConfig: any[] = [];

  constructor(private localDBService: LocalDatabaseService) {
    this.cache = [];
    this.isSelectedFiscalCode = false;
    this.inputFiscalCode = '';
    this.inputFiscalName = '';
  }

  private async getCache(): Promise<void> {
    this.cache = await this.localDBService.loadCache();
  }

  ngOnInit(): void {
    this.getCache();
  }

  public openModal(modalId: string): void {
    const modalName = `invoice-input-`;
    const modal = document.getElementById(modalName.concat(modalId));
    if (!modal) {
      alert('Invalid selection.');
      return;
    }
    modal.classList.remove('hidden');
  }

  public searchFiscalData(): void {
    // call to api to send code or name

    if (this.inputFiscalCode !== '') {
    }

    if (this.inputFiscalName !== '') {
    }
  }

  public selectInvoiceData(reservationId: string, data: any): void {
    this.preSelectedInvoiceData = { reservationId, data };
  }

  public saveFiscalDataSelection(): void {
    const target = this.cache.find(
      (data) =>
        data.reservation.id === this.preSelectedInvoiceData.reservationId
    );
    if (!target) {
      return;
    }

    this.invoicesConfig.push(this.preSelectedInvoiceData);
    this.clodeModal(this.preSelectedInvoiceData.reservationId);
    this.preSelectedInvoiceData = null;
  }

  public clodeModal(modalId: string) {
    this.preSelectedInvoiceData = null;
    const modalName = `invoice-input-`;
    const modal = document.getElementById(modalName.concat(modalId));
    if (!modal) {
      alert('Invalid selection.');
      return;
    }
    modal.classList.add('hidden');
  }
}

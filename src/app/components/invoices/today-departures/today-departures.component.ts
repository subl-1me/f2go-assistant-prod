import { Component, model, OnInit } from '@angular/core';
import { LocalDatabaseService } from '../../../services/local-database.service';
import StandardCheckResult from '../../../models/StandardCheckResult';
import { NgIf } from '@angular/common';
import { NO_FISCAL_USE_CODE } from '../../../const';
import { InvoiceService } from '../../../services/operations/invoice.service';
import { FormsModule } from '@angular/forms';
import Reservation from '../../../models/Reservation';
import { ReservationService } from '../../../services/operations/reservation.service';

@Component({
  selector: 'app-today-departures',
  imports: [NgIf, FormsModule],
  templateUrl: './today-departures.component.html',
  styleUrl: './today-departures.component.css',
})
export class TodayDeparturesComponent implements OnInit {
  public cache: StandardCheckResult[];
  public todayDepartures: Reservation[];
  public todayDeparturesDisplay: Reservation[];
  public displayedCache: StandardCheckResult[];

  public isSelectedFiscalCode: boolean;
  public inputFiscalName: string;
  public inputFiscalCode: string;
  public searchResults: any[] = [];
  public preSelectedInvoiceData: any = null;
  public markedReservations: any[] = [];
  public fiscalCodeInput: string;
  public displayedFiscalSearches: any = [];
  public selectedReservationsToInvoice: any[];
  public isLoadingFiscalSearches: boolean;
  public invoicesConfig: any[] = [];

  public isToggledSelectAll: boolean;
  public isLoadingDepartures: boolean;
  public loadError: boolean;

  constructor(
    private localDBService: LocalDatabaseService,
    private invoiceService: InvoiceService,
    private reservationService: ReservationService
  ) {
    this.cache = [];
    this.isSelectedFiscalCode = false;
    this.inputFiscalCode = '';
    this.inputFiscalName = '';
    this.selectedReservationsToInvoice = [];
    this.displayedFiscalSearches = [];
    this.displayedCache = [];
    this.fiscalCodeInput = '';
    this.isLoadingFiscalSearches = false;
    this.todayDepartures = [];
    this.todayDeparturesDisplay = [];
    this.getTodayDepartures();
    this.isToggledSelectAll = false;

    this.isLoadingDepartures = false;
    this.loadError = false;
  }

  private async getCache(): Promise<void> {
    this.cache = await this.localDBService.loadCache();
    this.displayedCache = this.cache;
  }

  private getTodayDepartures(): void {
    this.isLoadingDepartures = true;
    this.reservationService.getTodayDepartures().subscribe({
      next: (response) => {
        // map to reservation model
        const data = JSON.parse(response);
        this.todayDepartures = data.rows.map((rsrv: any) => {
          return {
            id: rsrv.rsrvCode,
            marriotId: '',
            guestName: rsrv.nameGuest,
            room: rsrv.room,
            roomType: rsrv.roomDescription,
            dateIn: rsrv.dateIn,
            dateOut: rsrv.dateOut,
            reservationStatus: rsrv.statusGuest,
            numberOfGuests: rsrv.peopleNo,
            company: rsrv.company,
            agency: rsrv.agency,
            membership: rsrv.freqTvl || '',
          } as Reservation;
        });
        this.todayDeparturesDisplay = [...this.todayDepartures];
        this.isLoadingDepartures = false;
      },
      error: (err) => {
        this.isLoadingDepartures = false;
        this.loadError = true;
      },
    });
  }

  ngOnInit(): void {
    this.getCache();
  }

  public hasFiscalDataOnCache(reservationId: string): boolean {
    const cache = this.cache.find(
      (rsrv) => rsrv.reservation.id === reservationId
    );
    if (!cache) {
      return false;
    }

    return cache.invoiceSettings ? true : false;
  }

  public searchForFiscalCode(): any {
    if (this.fiscalCodeInput === '') {
      return;
    }

    this.isLoadingFiscalSearches = true;
    // search on Front
    this.invoiceService.searchForReceptor(this.fiscalCodeInput).subscribe({
      next: (response) => {
        const data = JSON.parse(response);
        this.displayedFiscalSearches = [...data];
        this.isLoadingFiscalSearches = false;
      },
      error: (error) => {
        console.log(error);
      },
    });
  }

  public markAsCustom(reservationId: string, fiscalData: any): void {
    this.markedReservations.push({
      reservationId,
      mark: 'CUSTOM',
      fiscalData,
    });

    this.clodeModal(reservationId);
  }

  private markAsSelected(reservationId: string): void {
    const icon = document.getElementById(`select-rsrv-icon-${reservationId}`);
    if (!icon) {
      return;
    }

    icon.classList.remove('fa-circle');
    icon.classList.remove('fa-regular');
    icon.classList.add('fa-circle-check');
    icon.classList.add('fa-solid');
  }

  public resetAllSelectedData(): void {
    this.markedReservations = this.markedReservations.filter((reservation) =>
      this.selectedReservationsToInvoice.find(
        (rsrv) => rsrv.id === reservation.id
      )
    );
  }

  private unmarkAsSelected(reservationId: string): void {
    const icon = document.getElementById(`select-rsrv-icon-${reservationId}`);
    if (!icon) {
      return;
    }

    icon.classList.add('fa-circle');
    icon.classList.add('fa-regular');
    icon.classList.remove('fa-circle-check');
    icon.classList.remove('fa-solid');
  }

  public toggleSelectedToInvoice(reservationId: string): void {
    const isSelected = this.selectedReservationsToInvoice.find(
      (rsrv) => rsrv.id === reservationId
    );
    if (isSelected) {
      this.unmarkAsSelected(reservationId);
      this.selectedReservationsToInvoice =
        this.selectedReservationsToInvoice.filter(
          (rsrv) => rsrv.id !== reservationId
        );
      console.log(this.selectedReservationsToInvoice);
      return;
    }

    const target = this.todayDepartures.find(
      (departure) => departure.id === reservationId
    );
    if (!target) {
      return;
    }

    this.selectedReservationsToInvoice.push(target);
    this.markAsSelected(reservationId);
  }

  public showInvoicerConfirmation(): void {
    const confirmationModal = document.getElementById('confirmation-modal');
    if (!confirmationModal) {
      return;
    }

    confirmationModal.classList.remove('hidden');
  }

  public updateDepartureList(): void {
    this.loadError = false;
    this.isLoadingDepartures = false;
    this.getTodayDepartures();
  }

  public confirmInvoicerOperation(): void {
    this.closeInvoicerConfirmation();
  }

  public closeInvoicerConfirmation(): void {
    const confirmationModal = document.getElementById('confirmation-modal');
    if (!confirmationModal) {
      return;
    }

    confirmationModal.classList.add('hidden');
  }

  public toggleSelectAll(): void {
    this.selectedReservationsToInvoice = [];
    this.isToggledSelectAll = !this.isToggledSelectAll;
    this.isToggledSelectAll
      ? this.markAllAsSelected()
      : this.markAllAsUnselected();
  }

  public markSelectedAsGeneric(): void {
    this.selectedReservationsToInvoice.forEach((reservation) => {
      this.markAsGeneric(reservation.id);
    });
  }

  private markAllAsSelected(): void {
    this.selectedReservationsToInvoice = [...this.todayDeparturesDisplay];
    this.selectedReservationsToInvoice.forEach((rsrv) => {
      this.markAsSelected(rsrv.id);
    });
  }

  private markAllAsUnselected(): void {
    this.selectedReservationsToInvoice = [];
    this.todayDeparturesDisplay.forEach((rsrv) => {
      this.unmarkAsSelected(rsrv.id);
    });
  }

  public markAsGeneric(reservationId: string): void {
    this.markedReservations.push({
      reservationId,
      mark: 'GENERIC',
    });
  }

  public removeFromMark(reservationId: string): void {
    this.markedReservations = this.markedReservations.filter(
      (rsrv) => rsrv.reservationId !== reservationId
    );
  }

  public isReservationMarkedAsGeneric(reservationId: string): boolean {
    return (
      this.markedReservations.find(
        (rsrv) => rsrv.reservationId === reservationId
      ).mark === 'GENERIC'
    );
  }

  public isReservationMarkedAsCustom(reservationId: string): boolean {
    return (
      this.markedReservations.find(
        (rsrv) => rsrv.reservationId === reservationId
      ).mark === 'CUSTOM'
    );
  }

  public getInvoiceData(reservationId: string): any {
    return this.markedReservations.find(
      (rsrv) => rsrv.reservationId === reservationId
    );
  }

  public isReservationMarked(reservationId: string): boolean {
    return this.markedReservations.find(
      (rsrv) => rsrv.reservationId === reservationId
    );
  }

  // public async searchForInvoicingData(): Promise<any> {}

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

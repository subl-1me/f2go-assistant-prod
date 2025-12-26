import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import Reservation from '../../../models/Reservation';
import { FormsModule } from '@angular/forms';
import { CheckerService } from '../../../services/checker.service';
import { BackgroundProcessServiceService } from '../../../services/background-process-service.service';
import { ReservationService } from '../../../services/operations/reservation.service';
import StandardCheckResult from '../../../models/StandardCheckResult';
import { LocalDatabaseService } from '../../../services/local-database.service';

@Component({
  selector: 'app-checker',
  imports: [NgIf, FormsModule, CommonModule],
  templateUrl: './checker.component.html',
  styleUrl: './checker.component.css',
})
export class CheckerComponent {
  public inHouseReservations: Reservation[];
  public displaydReservations: Reservation[];
  public selectedReservations: Reservation[];
  public isLoadingInHouseReservations: boolean;
  public allSelected: boolean = false;
  public searchTerm: string;
  public showModal: boolean;
  public isChecking: boolean;

  public lastCheckerResults: StandardCheckResult[] = [];

  constructor(
    private checkerService: CheckerService,
    private backgroundProcessService: BackgroundProcessServiceService,
    private reservationService: ReservationService,
    private localDBService: LocalDatabaseService
  ) {
    this.inHouseReservations = [];
    this.selectedReservations = [];
    this.showModal = false;
    this.isLoadingInHouseReservations = true;
    this.searchTerm = '';
    this.displaydReservations = [];
    this.getInHouseReservations();
    this.isChecking = false;

    this.loadCache();
  }

  private async loadCache(): Promise<void> {
    this.lastCheckerResults = await this.localDBService.loadCache();
  }

  async getInHouseReservations() {
    this.isLoadingInHouseReservations = true;
    this.inHouseReservations =
      await this.reservationService.getInHouseReservations();
    this.displaydReservations = [...this.inHouseReservations];
    this.isLoadingInHouseReservations = false;
  }

  async showConfirmationModal() {
    this.showModal = true;
  }

  async confirmChecker() {
    this.isChecking = true;
    this.showModal = false;
    this.backgroundProcessService.startProcess(
      `Revisión de reservationes (${this.selectedReservations.length})`,
      100
    );
    const checkerResponse = await this.checkerService.performChecker(
      this.selectedReservations
    );

    const { updated, newData } = checkerResponse;
    // save new results to db
    const saveToDBPromises = newData.map(async (data: any) => {
      return await window.electron.ipcRenderer.invoke('write', data);
    });

    await Promise.all(saveToDBPromises);

    // const updateOnDBPromises = updated.map(async (data: any) => {
    //   return await window.electron.ipcRenderer.invoke('updateItem', data);
    // });

    // await Promise.all(updateOnDBPromises);

    this.isChecking = false;
  }

  async cancelOperation() {
    this.isChecking = false;
  }

  public isReservationChecked(reservationId: string): boolean {
    if (!reservationId) {
      return false;
    }

    return this.lastCheckerResults.find(
      (result) => result.reservation.id === reservationId
    )
      ? true
      : false;
  }

  public getLastCheck(reservationId: string): Date | null {
    if (!reservationId) {
      return null;
    }

    const result = this.lastCheckerResults.find(
      (result) => result.reservation.id === reservationId
    );
    if (!result) {
      return null;
    }

    return result.lastCheck;
  }

  filterReservations() {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.displaydReservations = [...this.inHouseReservations];
      return;
    }

    const searchTermLower = this.searchTerm.toLowerCase();
    this.displaydReservations = this.inHouseReservations.filter(
      (reservation) =>
        reservation.guestName.toLowerCase().includes(searchTermLower) ||
        reservation.id.toLowerCase().includes(searchTermLower) ||
        reservation.room.toLowerCase().includes(searchTermLower)
    );
  }

  toggleSelectAll() {
    if (this.allSelected) {
      this.selectedReservations = [...this.inHouseReservations];
    } else {
      this.selectedReservations = [];
    }

    this.allSelected = !this.allSelected;
  }

  toggleSelect(reservation: Reservation) {
    const index = this.selectedReservations.findIndex(
      (res) => res.id === reservation.id
    );
    if (index > -1) {
      this.selectedReservations.splice(index, 1);
    } else {
      this.selectedReservations.push(reservation);
    }
  }
}

import { Component } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import Reservation from '../../../models/Reservation';
import { FrontService } from '../../../services/front-service';
import { environment } from '../../../../environment';
import {
  PAYLOAD_STATUS_CHIN,
  PAYLOAD_STATUS_NOSHOW,
  PAYLOAD_STATUS_CHOUT,
} from '../../../const';
import { FormsModule } from '@angular/forms';
import { CheckerService } from '../../../services/checker.service';
import { BackgroundProcessServiceService } from '../../../services/background-process-service.service';
import { ReservationService } from '../../../services/operations/reservation.service';

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
  public reservations: Reservation[];
  public isLoadingInHouseReservations: boolean;
  public allSelected: boolean = false;
  public searchTerm: string;
  public showModal: boolean;
  public isChecking: boolean;

  constructor(
    private checkerService: CheckerService,
    private backgroundProcessService: BackgroundProcessServiceService,
    private reservationService: ReservationService
  ) {
    this.inHouseReservations = [];
    this.selectedReservations = [];
    this.showModal = false;
    this.isLoadingInHouseReservations = true;
    this.reservations = [];
    this.searchTerm = '';
    this.displaydReservations = [];
    this.getInHouseReservations();
    this.isChecking = false;
  }

  async getInHouseReservations() {
    this.isLoadingInHouseReservations = true;
    this.reservations = await this.reservationService.getInHouseReservations();
    this.displaydReservations = [...this.reservations];
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

    console.log(checkerResponse);

    this.isChecking = false;
  }

  async cancelOperation() {
    this.isChecking = false;
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

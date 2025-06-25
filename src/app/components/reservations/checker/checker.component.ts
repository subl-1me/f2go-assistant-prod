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

const roomTypes = ['Double', 'Single', 'Suite'];

@Component({
  selector: 'app-checker',
  imports: [NgIf, FormsModule, CommonModule],
  templateUrl: './checker.component.html',
  styleUrl: './checker.component.css',
})
export class CheckerComponent {
  public inHouseReservations: Reservation[];
  public selectedReservations: Reservation[];
  public isLoadingInHouseReservations: boolean;
  public allSelected: boolean = false;
  public searchTerm: string;
  public showModal: boolean;

  constructor(
    private frontService: FrontService,
    private checkerService: CheckerService,
    private backgroundProcessService: BackgroundProcessServiceService
  ) {
    this.inHouseReservations = [];
    this.selectedReservations = [];
    this.showModal = false;
    this.isLoadingInHouseReservations = true;
    this.searchTerm = '';
    this.getInHouseReservations();
  }

  async getInHouseReservations() {
    const payload = {
      pc: environment.HDN_001 || '',
      ph: false,
      pn: '',
      ci: '',
      gpi: '',
      ti: '',
      rc: '',
      rm: '',
      fm: '',
      to: '',
      fq: '',
      rs: PAYLOAD_STATUS_CHIN,
      st: 'EC',
      grp: '',
      gs: '',
      sidx: 'NameGuest',
      sord: 'asc',
      rows: 120,
      page: 1,
      ss: false,
      rcss: '',
      user: 'HTJUGALDEA',
      AddGuest: false,
    };

    this.frontService
      .postRequest(environment.FRONT_API_GET_RESERVATION_LIST, payload, true)
      .subscribe((response) => {
        if (response.status === 401) {
          alert('Unauthorized access. Please log in again.');
          return;
        }

        const data = JSON.parse(response);
        this.isLoadingInHouseReservations = false;
        this.inHouseReservations.push(
          ...data.rows.map((item: any) => {
            return {
              id: item.rsrvCode,
              marriotId: '',
              guestName: item.nameGuest,
              room: item.room,
              roomType: item.roomDescription.includes(
                roomTypes.forEach((type) => type)
              ),
              dateIn: item.dateIn,
              dateOut: item.dateOut,
              status: item.statusGuest.trim(),
              numberOfGuests: Number(item.peopleNo),
              company: item.company,
              agency: item.agency,
              membership: item.freqTvl,
            };
          })
        );
      });
  }

  async showConfirmationModal() {
    this.showModal = true;
  }

  async confirmChecker() {
    this.backgroundProcessService.startProcess(
      `Revisión de reservationes (${this.selectedReservations.length})`,
      100
    );
    await this.checkerService.performChecker(this.selectedReservations);
  }

  filterReservations() {}

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

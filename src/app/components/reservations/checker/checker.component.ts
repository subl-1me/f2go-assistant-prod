import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import Reservation from '../../../models/Reservation';
import { FrontService } from '../../../services/front-service';
import { environment } from '../../../../environment';
import {
  PAYLOAD_STATUS_CHIN,
  PAYLOAD_STATUS_NOSHOW,
  PAYLOAD_STATUS_CHOUT,
} from '../../../const';
import { FormsModule } from '@angular/forms';

const roomTypes = ['Double', 'Single', 'Suite'];

@Component({
  selector: 'app-checker',
  imports: [NgIf, FormsModule],
  templateUrl: './checker.component.html',
  styleUrl: './checker.component.css',
})
export class CheckerComponent {
  public inHouseReservations: Reservation[];
  public selectedReservations: Reservation[];
  public isLoadingInHouseReservations: boolean;
  public allSelected: boolean = false;
  public searchTerm: string;

  constructor(private frontService: FrontService) {
    this.inHouseReservations = [];
    this.selectedReservations = [];
    this.isLoadingInHouseReservations = true;
    this.searchTerm = '';
    // this.getInHouseReservations();
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
      st: 'LS',
      grp: '',
      gs: `${PAYLOAD_STATUS_CHOUT},${PAYLOAD_STATUS_CHIN},${PAYLOAD_STATUS_NOSHOW}`,
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

  async confirmSelectedReservations() {
    alert('Confirm?');
    console.log(this.selectedReservations);
  }

  filterReservations() {}

  toggleSelectAll() {
    if (this.allSelected) {
      this.selectedReservations = [...this.inHouseReservations];
    } else {
      this.selectedReservations = [];
    }
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

import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { CurrentStatusComponent } from './current-status/current-status.component';
import { CheckerComponent } from './checker/checker.component';
import { RoutingsComponent } from './routings/routings.component';
import { AutoAssignRoomsComponent } from './auto-assign-rooms/auto-assign-rooms.component';
import { ReservationService } from '../../services/operations/reservation.service';

@Component({
  selector: 'app-reservations',
  imports: [
    NgIf,
    CurrentStatusComponent,
    CheckerComponent,
    RoutingsComponent,
    AutoAssignRoomsComponent,
  ],
  templateUrl: './reservations.component.html',
  styleUrl: './reservations.component.css',
})
export class ReservationsComponent {
  isCurrentCardCollapsed = true;
  isCheckCardCollapsed = true;
  isRoutingCardCollapsed = true;
  isAutoAssignCardCollapsed = true;

  public constructor(private reservationService: ReservationService) {}

  public toggleCurrentCardCollapse(): void {
    this.isCurrentCardCollapsed = !this.isCurrentCardCollapsed;
  }

  public toggleCheckCardCollapse(): void {
    this.isCheckCardCollapsed = !this.isCheckCardCollapsed;
  }

  public toggleRoutingCardCollapse(): void {
    this.isRoutingCardCollapsed = !this.isRoutingCardCollapsed;
  }

  public toggleAutoAssignCardCollapse(): void {
    this.isAutoAssignCardCollapsed = !this.isAutoAssignCardCollapsed;
  }

  public async deleteFuturePreassignments(): Promise<void> {
    const futureReservations =
      await this.reservationService.getAllHistoricalReservations();

    const reservationsWithPreassignments = futureReservations.filter(
      (reservation) => reservation.room !== ''
    );

    // unassign rooms
    const facades = reservationsWithPreassignments.map((reservation) =>
      this.reservationService.getReservationFacade(
        reservation.id,
        reservation.room
      )
    );

    const results = reservationsWithPreassignments.map((reservation) =>
      this.reservationService.removeRoomPreassignment(
        reservation.id,
        reservation.room
      )
    );

    const resolvedResults = await Promise.all(results);
    console.log('Unassigned rooms for reservations:', resolvedResults);
  }
}

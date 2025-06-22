import Ledger from './Ledger';

export default interface Reservation {
  id: string;
  marriotId: string;
  guestName: string;
  room: string;
  roomType: string;
  dateIn: string;
  dateOut: string;
  reservationStatus: string;
  ledgers: Ledger[];
  numberOfGuests: number;
  company: string;
  agency: string;
  membership: string | null;
}

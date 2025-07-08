import AttachedDocuments from './AttachedDocuments';
import Ledger from './Ledger';
import PrePaidMethod from './PrePaidMethod';

export default interface Reservation {
  id: string;
  marriotId: string;
  guestName: string;
  room: string;
  roomType: string;
  dateIn: string;
  dateOut: string;
  reservationStatus: string;
  prepaidMethod?: PrePaidMethod;
  ledgers?: Ledger[];
  attachedDocuments?: AttachedDocuments[];
  numberOfGuests: number;
  company: string;
  agency: string;
  membership: string | null;
}

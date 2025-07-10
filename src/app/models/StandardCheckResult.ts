import Ledger from './Ledger';
import PrePaidMethod from './PrePaidMethod';
import Reservation from './Reservation';

export default interface StandardCheckResult {
  reservation: Reservation;
  documents: any[];
  paymentStatus: string;
  checkStatus: string;
  lastCheck: Date;
  checkAgainAt?: Date;
  prePaidMethod?: PrePaidMethod;
  ledgers: Ledger[];
}

import PrePaidMethod from './PrePaidMethod';
import Reservation from './Reservation';

export default interface StandardCheckResult {
  reservation: Reservation;
  documents: any[];
  paymentStatus: string;
  checkStatus: string;
  lastCheck: Date;
  checkAgainAt?: Date | string;
  prePaidMethod?: PrePaidMethod;
  activeCoupons?: any[];
  ledgersStatus: any;
}

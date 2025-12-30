import InvoiceSettings from './InvoiceSettings';
import PrePaidMethod from './PrePaidMethod';
import Reservation from './Reservation';
import Routing from './Routing';

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
  routing?: Routing;
  invoiceSettings?: InvoiceSettings;
}

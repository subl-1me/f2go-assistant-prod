import BonvoyCertificate from './BonvoyCertificate';
import Coupon from './Coupon';
import { VirtualCreditCard } from './VirtualCreditCard';

export default interface PrePaidMethod {
  type: string;
  data: VirtualCreditCard | BonvoyCertificate | Coupon | null;
}

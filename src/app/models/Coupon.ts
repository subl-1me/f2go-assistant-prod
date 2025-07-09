import CouponExtraction from './CouponExtraction';

export default interface Coupon {
  sourceReservation: string;
  provider: string;
  isValid: boolean;
  couponExtraction?: CouponExtraction;
}

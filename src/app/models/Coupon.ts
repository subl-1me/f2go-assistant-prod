export default interface Coupon {
  id: string | null;
  sourceReservation: string;
  filePath: string;
  provider: string;
  isValid: boolean;
  analysis?: any;
}

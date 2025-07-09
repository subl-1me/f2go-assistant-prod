export default interface CouponExtraction {
  targetHotel: string;
  targetReservationId: string;
  checkInDate: string;
  checkOutDate: string;
  totalToPay: number;
  guestName: string;
  invoiceFiscalCodeTarget: string;
  invoiceEmailTarget: string[];
}

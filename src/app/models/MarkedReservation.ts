export default interface MarkedReservation {
  reservationId: string;
  mark: string;
  ledgerTarget: number;
  fiscalData?: any;
}

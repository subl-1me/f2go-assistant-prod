export default interface InvoiceSettings {
  reservationTarget: string;
  ledgerTarget: number;
  isGeneric: boolean;
  fiscalCode: string;
  emails: string[];
  cfdiUse: string;
  frontEntity?: any;
  note?: string;
}

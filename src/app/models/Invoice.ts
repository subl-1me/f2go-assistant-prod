export default interface Invoice {
  ledgerNo: number | Number;
  fiscalCode: string;
  fiscalName: string;
  status: string;
  isGeneric: boolean;
  receiptId?: string;
  downloadUrl?: string;
}

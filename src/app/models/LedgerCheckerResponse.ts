import LedgerClassification from './LedgerClassification';

export default interface LedgerCheckerResponse {
  error: boolean;
  errors: Error[];
  isPendingToPay: boolean;
  isFullyPaid: boolean;
  isPartialPay: boolean;
  isTodayPaid: boolean;
  ledgersPendingToPay: number[];
  ledgersPaid: number[];
  classification: LedgerClassification;
}

interface Error {
  message: string;
}

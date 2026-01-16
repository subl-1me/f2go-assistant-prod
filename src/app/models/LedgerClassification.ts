import Ledger from './Ledger';

export default interface LedgerClassification {
  active: Ledger[];
  invoicable: Ledger[];
  inactive: Ledger[];
  invoiced: Ledger[];
  nousable: Ledger[];
}

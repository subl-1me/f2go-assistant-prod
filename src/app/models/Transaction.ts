export default interface Transaction {
  transactionId: string;
  type: string;
  code: string;
  isRefund: boolean;
  amount: number;
  date: string | Date;
}

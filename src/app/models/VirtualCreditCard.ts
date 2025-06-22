export interface VirtualCreditCard {
  provider: string | null;
  amount: Number;
  type?: string;
  readyToCharge?: boolean;
  signature?: string;
  isValid: boolean;
}

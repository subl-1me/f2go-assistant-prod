export default interface Routing {
  parentId: string;
  isParent: boolean;
  isRouted: boolean;
  parentLedgerTarget?: number | Number;
  childs?: string[];
  check?: Check;
}

interface Check {
  success: boolean;
  errors: string[];
  diff: number | Number;
  totalPaid: number | Number;
  totalToPay: number | Number;
}

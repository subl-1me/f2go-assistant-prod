// Payload reservation status
export const PAYLOAD_STATUS_CHIN = 'CHIN';
export const PAYLOAD_STATUS_NOSHOW = 'NOSHOW';
export const PAYLOAD_STATUS_CHOUT = 'CHOUT';
export const PAYLOAD_STATUS_POST = 'POST';

// reservation search filters
export const DEPARTURES_FILTER = 'departures';
export const IN_HOUSE_FILTER = 'in-house';
export const IN_CHECK_OUT_FILTER = 'CHOUT';

// Default VCC data
export const DEFAULT_VCC_PROVIDER = 'NONE';
export const DEFAULT_VCC_TYPE = 'INVALID';

// Default prepaid method data
export const DEFAULT_PREPAID_TYPE = 'NONE';
export const DEFAULT_PREPAID_PROVIDER = 'NO_VALID_PROVIDER_FOUND';

// Prepaid method names
export const VIRTUAL_CREDIT_CARD = 'VIRTUAL_CREDIT_CARD';
export const COUPON = 'COUPON';
export const BONVOY_CERTIFICATE = 'BONVOY_CERTIFICATE';

// Document types
export const DOCUMENT_TYPE_COUPON = 'COUPON';
export const DOCUMENT_TYPE_INVOICE = 'INVOICE';
export const DOCUMENT_TYPE_UNSUPORTED = 'UNSUPPORTED';
export const DOCUMENT_TYPE_RFC = 'RFC';

// Payment status
export const PAYMENT_STATUS_PENDING = 'PENDING';
export const PAYMENT_STATUS_FULLY_PAID = 'FULLY_PAID';
export const PAYMENT_STATUS_TODAY_PAID = 'TODAY_PAID';
export const PAYMENT_STATUS_PARTIAL = 'PARTIAL';
export const PAYMENT_STATUS_ERROR = 'ERROR';
export const PAYMENT_STATUS_PREPAID = 'PREPAID';
export const PAYMENT_STATUS_MASTER = 'MASTER';
export const PAYMENT_STATUS_ROUTED = 'ROUTED';

// Checker status
export const CHECKER_STATUS_PENDING = 'PENDING';
export const CHECKER_STATUS_CHECKING = 'CHECKING';
export const CHECKER_STATUS_CHECKED = 'CHECKED';

// Coupons providers names
export const ACCESS = 'CITY_ACCESS';
export const BAUSER = 'BAUSER';
export const CORPORATE_TRAVEL_SERVICES = 'CORPORATE_TRAVEL_SERVICES';
export const GBT_TRAVEL_SERVICES = 'GBT_TRAVEL_SERVICES';
export const VIAJES_EL_CORTE_INGLES = 'VIAJES_EL_CORTE_INGLES';
export const BCD_TRAVEL = 'BCD_TRAVEL';
export const NOKTOS = 'NOKTOS';

// Misc documents declarations
export const RFC_DOCUMENT_SIGNATURE = 'CONSTANCIA DE SITUACIÓN FISCAL';

// utils
export const ROOM_TYPES = ['Double', 'Single', 'Suite'];

// audit printer guides
export const reportsByUser = {
  accountant: [
    'rpt_Early_Bird',
    'rpt_daybalance',
    'rpt_AccountCxC',
    'rpt_dailytransactions2',
    'rpt_guestbalance',
    'rpt_todaychin',
    'rpt_Cajeros_Resum',
    'rpt_cajeros',
    'rpt_cajeroindividual',
    'rpt_cajeros_smart',
    'rpt_depbalance',
    'rpt_deptransferidos',
    'rpt_nad_balance',
    'rpt_CancelAdjust',
    'rpt_RSRV_CXLD',
    'rpt_FoliosVirtuales',
  ],
  manager: [
    'rpt_Early_Bird',
    'rpt_todaychin',
    'rpt_dailytransactions2',
    'rpt_guestbalance',
    'rpt_nad_balance',
    'rpt_CancelAdjust',
  ],
  salesManager: ['rpt_Early_Bird', 'rpt_todaychin', 'rpt_CancelAdjust'],
  extras: ['rpt_guestbalance'],
};

// INVOICES
export const NO_FISCAL_USE_CODE = 'SF01';

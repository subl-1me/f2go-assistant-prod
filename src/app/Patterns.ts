import CouponsProvidersPatterns from './models/CouponsProvidersPatterns';

export const VCC_PROVIDERS_PATTERN_LIST = {
  BOOKING: {
    USE_DECLARATION: /VIRTUAL CREDIT CARD/,
    AMOUNT_TO_CHARGE_DECLARATION: /VCC AUTH MXN\d+\.\d+|VCC AUTH MXN\d+/,
    AMOUNT: /\d+\.\d+|\d+/,
  },
  EXPEDIA: {
    USE_DECLARATION: /SGL USE CC/,
    AMOUNT_TO_CHARGE_DECLARATION: /MXN \d+\.\d+|MXN \d+/,
    AMOUNT: /\d+\.\d+|\d+/,
  },
  EBOOKING: {
    USE_DECLARATION: /VCC AUTH/,
    AMOUNT_TO_CHARGE_DECLARATION: /MXN\d+\.\d+|MXN \d+\.\d+/,
    AMOUNT: /\d+\.\d+|MXN \d+\.\d+/,
  },
  AGODA: {
    USE_DECLARATION: /VIRTUAL CREDIT CARD/,
    AMOUNT_TO_CHARGE_DECLARATION: /\d+\.\d+|\d+/,
    AMOUNT: /\d+\.\d+|\d+/,
  },
};

export const COUPONS_PROVIDERS_PATTERNS: CouponsProvidersPatterns = {
  CORPORATE_TRAVEL_SERVICES: {
    SIGNATURE: /CORPORATETRAVELSERVICESWORLDWIDESAPIDE/,
    TARGET_HOTEL: /CITYEXPRESSBYMARRIOTTCIUDADJUAREZ/,
    GUEST_NAME: /TITULAR\n.*/,
    CHECK_IN: /FECHADEENTRADA:\d+\/\d+\/\d+/,
    CHECK_OUT: /FECHADESALIDA:\d+\/\d+\/\d+/,
    RESERVATION_ID_TARGET: /CLAVE\d{8}/,
    INVOICE_RFC_TARGET:
      /[a-zA-Z0-9]{3}\d{7}[a-zA-Z0-9]{1}\d{1}|[a-zA-Z0-9]{3}\d{6}[a-zA-Z0-9]{2}\d{1}|[a-zA-Z0-9]{3}\d{6}[a-zA-Z0-9]{1}\d{2}|[a-zA-Z0-9]{3}\d{7}[a-zA-Z0-9]{2}|[a-zA-Z0-9]{3}\d{6}[a-zA-Z0-9]{3}/,
    INVOICE_EMAIL_TARGET: /[\w.-]+@[\w.-]+\.\w{2,}/g,
  },
  GBT_TRAVEL_SERVICES: {
    SIGNATURE: /GBT TRAVEL SERVICES MEXICO/,
    TARGET_HOTEL: /CITY EXPRESS CIUDAD JUAREZ/,
    GUEST_NAME: /^(.+?)\s*DATE ISSUED/,
    CHECK_IN: /\d{2}-.{3}-\d{4}/g,
    CHECK_OUT: /\d{2}-.{3}-\d{4}/,
    RESERVATION_ID_TARGET: /9\d{7}|7\d{7}/,
    INVOICE_RFC_TARGET: /.{3}-\d{6}-.{2}\d{1}/,
    INVOICE_EMAIL_TARGET: /[\w.-]+@[\w.-]+\.\w{2,}/g,
    TOTAL_AMOUNT: /\$\d+,\d+\.\d+|\$\d+,\d+|\$\d+\.\d+/g,
    BASE_RATE: /\$\d+,\d+\.\d+|\$\d+,\d+|\$\d+\.\d+/g,
  },
  NOKTOS: {
    SIGNATURE: /NOKTOS/,
    TARGET_HOTEL: /CITY EXPRESS CIUDAD JUAREZ/,
    GUEST_NAME: /\s[^HOLA](.*)[^,\n]/,
    CHECK_IN: /\d{4}-\n\d{2}-\d{2}/g,
    CHECK_OUT: /\d{4}-\n\d{2}-\d{2}/g,
    RESERVATION_ID_TARGET: /\d{8}/,
    INVOICE_RFC_TARGET: /.{3}-\d{6}-.{2}\d{1}/,
    INVOICE_EMAIL_TARGET: /[\w.-]+@[\w.-]+\.\w{2,}/g,
  },
  BAUSER: {
    SIGNATURE: /BAUSER/,
    TARGET_HOTEL: /CITYEXPRESSBYMARRIOTTCIUDADJUAREZ/,
    GUEST_NAME: /Titular\n.*/,
    CHECK_IN: /FECHADEENTRADA:\d+\/\d+\/\d+/,
    CHECK_OUT: /FECHADESALIDA:\d+\/\d+\/\d+/,
    RESERVATION_ID_TARGET: /Clave\d{8}/,
    INVOICE_RFC_TARGET:
      /[a-zA-Z0-9]{3}\d{7}[a-zA-Z0-9]{1}\d{1}|[a-zA-Z0-9]{3}\d{6}[a-zA-Z0-9]{2}\d{1}|[a-zA-Z0-9]{3}\d{6}[a-zA-Z0-9]{1}\d{2}|[a-zA-Z0-9]{3}\d{7}[a-zA-Z0-9]{2}|[a-zA-Z0-9]{3}\d{6}[a-zA-Z0-9]{3}/,
    INVOICE_EMAIL_TARGET: /[\w.-]+@[\w.-]+\.\w{2,}/g,
  },
  VIAJES_EL_CORTE_INGLES: {
    SIGNATURE: /VIAJES ECI, MEXICO/,
    TARGET_HOTEL: /CITY EXPRESS BY MARRIOTT CIUDAD JUA/,
    GUEST_NAME: /SR\.\/SRA\.:(.*[^-\d PAX\n])/,
    CHECK_IN: /FECHA:\s.*?\d{2},\s\d{4}/gm,
    CHECK_OUT: /SALIDA:\s.*?\d{2},\s\d{4}/gm,
    RESERVATION_ID_TARGET: /CONFIRMACIÓN: \d{8}/,
    TOTAL_AMOUNT: /TRF(.*)|TARIFA(.*)/,
    INVOICE_RFC_TARGET:
      /[a-zA-Z0-9]{3}\d{7}[a-zA-Z0-9]{1}\d{1}|[a-zA-Z0-9]{3}\d{6}[a-zA-Z0-9]{2}\d{1}|[a-zA-Z0-9]{3}\d{6}[a-zA-Z0-9]{1}\d{2}|[a-zA-Z0-9]{3}\d{7}[a-zA-Z0-9]{2}|[a-zA-Z0-9]{3}\d{6}[a-zA-Z0-9]{3}/,
    INVOICE_EMAIL_TARGET: /[\w.-]+@[\w.-]+\.\w{2,}/g,
  },
  CITY_ACCESS: {
    SIGNATURE: /CUPÓN ACCESS/,
    TARGET_HOTEL: /HOTEL\n.*/,
    GUEST_NAME: /NOMBRE DEL HUÉSPED\n.*/,
    CHECK_IN: /FECHA DE ENTRADA\n.*/,
    CHECK_OUT: /FECHA DE SALIDA\n.*/,
    RESERVATION_ID_TARGET: /CLAVE DE CONFIRMACIÓN\n.*/,
    INVOICE_RFC_TARGET:
      /[a-zA-Z0-9]{3}\d{7}[a-zA-Z0-9]{1}\d{1}|[a-zA-Z0-9]{3}\d{6}[a-zA-Z0-9]{2}\d{1}|[a-zA-Z0-9]{3}\d{6}[a-zA-Z0-9]{1}\d{2}|[a-zA-Z0-9]{3}\d{7}[a-zA-Z0-9]{2}|[a-zA-Z0-9]{3}\d{6}[a-zA-Z0-9]{3}/,
    INVOICE_EMAIL_TARGET: /[\w.-]+@[\w.-]+\.\w{2,}/g,
    BASE_RATE: /TARIFA\n.*/,
  },
  BCD_TRAVEL: {
    SIGNATURE: /BCD(.*)TRAVEL/,
    TARGET_HOTEL: /CITY EXPRESS CIUDAD JUAREZ/,
    GUEST_NAME: /NAMES\n.*/,
    CHECK_IN: /\d{1,2}\/\d{1,2}\/\d{4}/g,
    CHECK_OUT: /\d{1,2}\/\d{1,2}\/\d{4}/g,
    RESERVATION_ID_TARGET: /\d{8}/,
    INVOICE_RFC_TARGET: /BTR(.*)/gm,
    INVOICE_EMAIL_TARGET: /[\w.-]+@[\w.-]+\.\w{2,}/g,
    BASE_RATE: /\d+\.\d+|\d+ MXN/g,
    TOTAL_AMOUNT: /\d+\.\d+|\d+ MXN/g,
  },
};

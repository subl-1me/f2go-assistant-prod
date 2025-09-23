interface CouponsProvidersPatterns {
  CORPORATE_TRAVEL_SERVICES: Patterns;
  GBT_TRAVEL_SERVICES: Patterns;
  VIAJES_EL_CORTE_INGLES: Patterns;
  BAUSER: Patterns;
  CITY_ACCESS: Patterns;
  BCD_TRAVEL: Patterns;
  NOKTOS: Patterns;
}

interface Patterns {
  SIGNATURE: RegExp;
  TARGET_HOTEL: RegExp;
  GUEST_NAME: RegExp;
  CHECK_IN: RegExp;
  CHECK_OUT: RegExp;
  DATES?: RegExp;
  RESERVATION_ID_TARGET: RegExp;
  INVOICE_RFC_TARGET: RegExp;
  INVOICE_EMAIL_TARGET: RegExp;
  BASE_RATE?: RegExp;
  TOTAL_AMOUNT?: RegExp;
}

export default CouponsProvidersPatterns;

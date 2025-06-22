export default interface VCCProvidersPatterns {
  BOOKING: Patterns;
  EBOOKING: Patterns;
  EXPEDIA: Patterns;
  AGODA: Patterns;
}

interface Patterns {
  USE_DECLARATION: RegExp;
  AMOUNT_TO_CHARGE_DECLARATION: RegExp;
  AMOUNT: RegExp;
}

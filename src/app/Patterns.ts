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

// import { DOCUMENT_TYPE_COUPON, DOCUMENT_TYPE_UNSUPORTED } from '../const';
// import CouponsProvidersPatterns from '../models/CouponsProvidersPatterns';
// import { COUPONS_PROVIDERS_PATTERNS } from '../Patterns';

import CouponsProvidersPatterns from '../models/CouponsProvidersPatterns';
const { DOCUMENT_TYPE_COUPON, DOCUMENT_TYPE_UNSUPORTED } = require('../const');
const { COUPONS_PROVIDERS_PATTERNS } = require('../Patterns');

export default class DocumentAnalyzer {
  private static sanitizeText(text: string): string {
    return text
      .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .toUpperCase();
  }

  static classify(text: string): any {
    let type = DOCUMENT_TYPE_UNSUPORTED;
    text = this.sanitizeText(text);

    // Check if document is a Coupon
    const couponProvidersNames = Object.keys(COUPONS_PROVIDERS_PATTERNS);
    for (const provider of couponProvidersNames) {
      const signature = text.match(
        COUPONS_PROVIDERS_PATTERNS[provider as keyof CouponsProvidersPatterns]
          .SIGNATURE
      );

      // means its coupon
      if (signature) {
        return { type: DOCUMENT_TYPE_COUPON, provider };
      }
    }

    return { type, provider: null };
  }
}

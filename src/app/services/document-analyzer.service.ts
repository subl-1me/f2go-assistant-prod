import { Injectable } from '@angular/core';
import { lastValueFrom, map } from 'rxjs';
import { ProxyService } from './proxy.service';
import { COUPONS_PROVIDERS_PATTERNS } from '../Patterns';
import CouponsProvidersPatterns from '../models/CouponsProvidersPatterns';
import {
  DOCUMENT_TYPE_COUPON,
  DOCUMENT_TYPE_RFC,
  DOCUMENT_TYPE_UNSUPORTED,
  RFC_DOCUMENT_SIGNATURE,
} from '../const';
import CouponExtraction from '../models/CouponExtraction';
import Reservation from '../models/Reservation';
import { environment } from '../../environment.example';
import Comparation from '../models/Comparation';
import CouponDataExtraction from '../shared/coupon-extractions';
import Comparator from '../shared/comparator';

@Injectable({
  providedIn: 'root',
})
export class DocumentAnalyzerService {
  constructor(private proxyService: ProxyService) {}

  public async analyze(path: string): Promise<any> {
    if (!path || path === '') {
      return { error: true, message: 'PDF file path required.' };
    }

    try {
      const response = await lastValueFrom(
        this.proxyService.extractPDFText(path)
      );

      if (response.status !== 200) {
        return {
          error: true,
          message: `Unexpected error trying to extract PDF text. ${response.statusText}`,
        };
      }

      const text = response.body.text;
      const sanitized = this.sanitizeText(text);
      const { type, provider } = this.classify(sanitized);

      if (type === DOCUMENT_TYPE_UNSUPORTED) {
        return {
          error: true,
          message: `Unsupported document.`,
        };
      }

      if (type === DOCUMENT_TYPE_COUPON && provider) {
        return {
          error: false,
          type,
          provider,
          text: sanitized,
        };
      }

      if (type === RFC_DOCUMENT_SIGNATURE) {
        return {
          error: false,
          type,
          message: `The document is classified as ${provider}.`,
        };
      }

      return { error: false, type, provider: provider || null };
    } catch (err) {
      return {
        error: true,
        message: `Unexpected error trying to extract PDF text. ${
          err instanceof Error ? err.message : 'Unexpected error'
        }`,
      };
    }
  }

  private sanitizeText(text: string): string {
    return text
      .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .toUpperCase();
  }

  private classify(text: string): any {
    let type = DOCUMENT_TYPE_UNSUPORTED;
    text = this.sanitizeText(text);

    // safety
    const hasCardNumbers = text.match(
      /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})$/gm
    );
    if (hasCardNumbers) {
      return { type, provider: null };
    }

    // Check if document is a Coupon
    const couponProvidersNames = Object.keys(COUPONS_PROVIDERS_PATTERNS);
    for (const provider of couponProvidersNames) {
      const signature = text.match(
        COUPONS_PROVIDERS_PATTERNS[provider as keyof CouponsProvidersPatterns]
          .SIGNATURE
      );

      // means its coupon
      if (signature) {
        return { type: DOCUMENT_TYPE_COUPON, provider, sanitizedText: text };
      }
    }

    // means its fiscal RFC document
    const rfcSignature = text.includes(RFC_DOCUMENT_SIGNATURE);
    if (rfcSignature) {
      return { type: DOCUMENT_TYPE_RFC, sanitizedText: text };
    }

    return { type, provider: null };
  }

  public extract(provider: string, text: string): CouponExtraction {
    const extractor = new CouponDataExtraction(provider, text);
    const extraction = extractor.extract();
    return extraction;
  }

  public compare(
    reservation: Reservation,
    extraction: CouponExtraction
  ): Comparation {
    const comparator = new Comparator(reservation, extraction);
    const comparation = comparator.compare();
    return comparation;
  }
}

import { Injectable } from '@angular/core';
import { lastValueFrom, map } from 'rxjs';
import { ProxyService } from './proxy.service';
import { COUPONS_PROVIDERS_PATTERNS } from '../Patterns';
import CouponsProvidersPatterns from '../models/CouponsProvidersPatterns';
import {
  ACCESS,
  BCD_TRAVEL,
  CORPORATE_TRAVEL_SERVICES,
  DOCUMENT_TYPE_COUPON,
  DOCUMENT_TYPE_RFC,
  DOCUMENT_TYPE_UNSUPORTED,
  GBT_TRAVEL_SERVICES,
} from '../const';
import CouponExtraction from '../models/CouponExtraction';
import Reservation from '../models/Reservation';
import { environment } from '../../environment';
import Comparation from '../models/Comparation';

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
          message: `Unsupported document type. The document is classified as ${type}.`,
        };
      }

      if (type === DOCUMENT_TYPE_COUPON && provider) {
        const extraction = this.startCouponExtractionProcess(
          provider,
          sanitized
        );

        return {
          error: false,
          type,
          data: extraction,
          provider,
        };
      }

      if (type === DOCUMENT_TYPE_RFC) {
        return {
          error: false,
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

  public compare(
    reservation: Reservation,
    extraction: CouponExtraction
  ): Comparation {
    const { targetHotel, guestName, checkInDate, checkOutDate } = extraction;

    // Compare hotel names
    const hotelNameSimilarity = () => {
      const normalizedTarget = targetHotel
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

      const similarity =
        normalizedTarget === environment.HOTEL_NAME.toUpperCase() ? 1 : 0.8;
      return { similarity, fields: [normalizedTarget, environment.HOTEL_NAME] };
    };

    // Compare guest names
    const guestNameSimilarity = () => {
      const normalizedGuest = guestName
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

      const similarity =
        normalizedGuest === reservation.guestName.toUpperCase() ? 1 : 0.8;
      return { similarity, fields: [normalizedGuest, reservation.guestName] };
    };

    // Compare check-in dates
    const checkInDateSimilarity = () => {
      const normalizedCheckIn = checkInDate
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

      const similarity =
        normalizedCheckIn === reservation.dateIn.toUpperCase() ? 1 : 0.8;
      return { similarity, fields: [normalizedCheckIn, reservation.dateIn] };
    };

    // Compare check-out dates
    const checkOutDateSimilarity = () => {
      const normalizedCheckOut = checkOutDate
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

      const similarity =
        normalizedCheckOut === reservation.dateOut.toUpperCase() ? 1 : 0.8;
      return { similarity, fields: [normalizedCheckOut, reservation.dateOut] };
    };

    // Calculate overall similarity score
    const overallSimilarity =
      (hotelNameSimilarity().similarity +
        guestNameSimilarity().similarity +
        checkInDateSimilarity().similarity +
        checkOutDateSimilarity().similarity) /
      4;

    return {
      hotelName: hotelNameSimilarity(),
      guestName: guestNameSimilarity(),
      checkIn: checkInDateSimilarity(),
      checkOut: checkOutDateSimilarity(),
      overallSimilarity,
    } as Comparation;
  }

  private startCouponExtractionProcess(provider: string, text: string): any {
    let extraction: any = null;

    switch (provider) {
      case CORPORATE_TRAVEL_SERVICES:
        extraction = this.extractCTSData(text);
        break;
      case ACCESS:
        extraction = this.extractCityAcessData(text);
        break;
      case GBT_TRAVEL_SERVICES:
        extraction = this.extractGBTData(text);
        break;
      case BCD_TRAVEL:
        extraction = this.extractBCDData(text);
        break;
      default:
        console.log(`Invalid coupon provider signature: ${provider}`);
        break;
    }

    return extraction;
  }

  private extractBCDData(text: string): CouponExtraction {
    const { BCD_TRAVEL } = COUPONS_PROVIDERS_PATTERNS;
    const getTargetHotelName = () => {
      const targetMatch = text.match(BCD_TRAVEL.TARGET_HOTEL);
      if (targetMatch) {
        return targetMatch[0];
      }
      return '';
    };

    const getTargetGuestName = () => {
      const guestNameMatch = text.match(BCD_TRAVEL.GUEST_NAME);
      if (guestNameMatch) {
        const name = guestNameMatch[0]
          .replace('NAMES', '')
          .replace('/', '')
          .trim();
        return name;
      }
      return '';
    };

    const getCheckInDates = () => {
      const checkInMatch = text.match(BCD_TRAVEL.CHECK_IN);
      if (checkInMatch) {
        const checkIn = checkInMatch[0].replace('CHECK IN DATE', '').trim();
        return checkIn;
      }
      return '';
    };

    const getCheckOutDates = () => {
      const checkInMatch = text.match(BCD_TRAVEL.CHECK_OUT);
      if (checkInMatch) {
        const checkIn = checkInMatch[0].replace('CHECK OUT DATE:', '').trim();
        return checkIn;
      }
      return '';
    };

    const getReservationIdTarget = () => {
      const reservationIdMatch = text.match(BCD_TRAVEL.RESERVATION_ID_TARGET);
      if (reservationIdMatch) {
        const matchResult = reservationIdMatch[0].match(/\d{8}/);
        const reservationIdTarget = matchResult ? matchResult[0] : '';
        return reservationIdTarget;
      }

      return '';
    };

    const getInvoiceRFCTarget = () => {
      const RFCTargetMatch = text.match(BCD_TRAVEL.INVOICE_RFC_TARGET);
      if (RFCTargetMatch) {
        return RFCTargetMatch[0];
      }

      return '';
    };

    const getInvoiceEmailTarget = () => {
      const emailTargetMatch = text.match(BCD_TRAVEL.INVOICE_EMAIL_TARGET);
      if (emailTargetMatch) {
        return emailTargetMatch;
      }

      return [];
    };

    return {
      targetHotel: getTargetHotelName(),
      guestName: getTargetGuestName(),
      checkInDate: getCheckInDates(),
      checkOutDate: getCheckOutDates(),
      targetReservationId: getReservationIdTarget(),
      invoiceFiscalCodeTarget: getInvoiceRFCTarget(),
      invoiceEmailTarget: getInvoiceEmailTarget(),
      totalToPay: 0, // Not available in CTS data
    } as CouponExtraction;
  }

  private extractCTSData(text: string): CouponExtraction {
    const { CORPORATE_TRAVEL_SERVICES } = COUPONS_PROVIDERS_PATTERNS;
    const getTargetHotelName = () => {
      const targetMatch = text.match(CORPORATE_TRAVEL_SERVICES.TARGET_HOTEL);
      if (targetMatch) {
        return targetMatch[0];
        // const normalizedTarget = targetMatch[0]
        //   .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        //   .replace(/\s+/g, ' ')
        //   .trim()
        //   .toUpperCase();

        // const similarity =
        //   normalizedTarget === targetMatch[0].toUpperCase() ? 1 : 0.8;
        // return similarity;
      }

      return '';
    };

    const getTargetGuestName = () => {
      const guestNameMatch = text.match(CORPORATE_TRAVEL_SERVICES.GUEST_NAME);
      if (guestNameMatch) {
        return guestNameMatch[0];
      }

      return '';
    };

    const getCheckInDates = () => {
      const checkInMatch = text.match(CORPORATE_TRAVEL_SERVICES.CHECK_IN);
      if (checkInMatch) {
        const checkIn = checkInMatch[0].replace('FECHADEENTRADA:', '').trim();
        return checkIn;
      }
      return '';
    };

    const getCheckOutDates = () => {
      const checkInMatch = text.match(CORPORATE_TRAVEL_SERVICES.CHECK_OUT);
      if (checkInMatch) {
        const checkIn = checkInMatch[0].replace('FECHADESALIDA:', '').trim();
        return checkIn;
      }
      return '';
    };

    const getReservationIdTarget = () => {
      const reservationIdMatch = text.match(
        CORPORATE_TRAVEL_SERVICES.RESERVATION_ID_TARGET
      );
      if (reservationIdMatch) {
        const matchResult = reservationIdMatch[0].match(/\d{8}/);
        const reservationIdTarget = matchResult ? matchResult[0] : '';
        return reservationIdTarget;
      }

      return '';
    };

    const getInvoiceRFCTarget = () => {
      const RFCTargetMatch = text.match(
        CORPORATE_TRAVEL_SERVICES.INVOICE_RFC_TARGET
      );
      if (RFCTargetMatch) {
        return RFCTargetMatch[0];
      }

      return '';
    };

    const getInvoiceEmailTarget = () => {
      const emailTargetMatch = text.match(
        CORPORATE_TRAVEL_SERVICES.INVOICE_EMAIL_TARGET
      );
      if (emailTargetMatch) {
        return emailTargetMatch;
      }

      return [];
    };

    return {
      targetHotel: getTargetHotelName(),
      guestName: getTargetGuestName(),
      checkInDate: getCheckInDates(),
      checkOutDate: getCheckOutDates(),
      targetReservationId: getReservationIdTarget(),
      invoiceFiscalCodeTarget: getInvoiceRFCTarget(),
      invoiceEmailTarget: getInvoiceEmailTarget(),
      totalToPay: 0, // Not available in CTS data
    } as CouponExtraction;
  }

  private extractCityAcessData(text: string): CouponExtraction {
    const { CITY_ACCESS } = COUPONS_PROVIDERS_PATTERNS;
    const getTargetHotel = () => {
      const match = text.match(CITY_ACCESS.TARGET_HOTEL);
      if (match) {
        const targetHotel = match[0].replace('HOTEL', '').trim();
        return targetHotel;
      }

      return '';
    };

    const getGuestName = () => {
      const match = text.match(CITY_ACCESS.GUEST_NAME);
      if (match) {
        const guestName = match[0].replace('NOMBRE DEL HUÉSPED', '').trim();
        return guestName;
      }

      return '';
    };

    const getCheckInDate = () => {
      const match = text.match(CITY_ACCESS.CHECK_IN);
      if (match) {
        return match[0].replace('FECHA DE ENTRADA', '').trim();
      }

      return '';
    };

    const getCheckOutDate = () => {
      const match = text.match(CITY_ACCESS.CHECK_OUT);
      if (match) {
        return match[0].replace('FECHA DE SALIDA', '').trim();
      }
      return '';
    };

    const getReservationIdTarget = () => {
      const match = text.match(CITY_ACCESS.RESERVATION_ID_TARGET);
      if (match) {
        return match[0].replace('CLAVE DE CONFIRMACIÓN', '').trim();
      }
      return '';
    };

    const getInvoiceRFCTarget = () => {
      const match = text.match(CITY_ACCESS.INVOICE_RFC_TARGET);
      if (match) {
        return match[0];
      }
      return '';
    };

    const getInvoiceEmails = () => {
      const match = text.match(CITY_ACCESS.INVOICE_EMAIL_TARGET);
      if (match) {
        return match;
      }
      return '';
    };

    const getTotalToPay = () => {
      if (!CITY_ACCESS.BASE_RATE) {
        return '';
      }

      const match = text.match(CITY_ACCESS.BASE_RATE);
      if (match) {
        return Number(
          match[0]
            .replace('TARIFA', '')
            .replace('$', '')
            .replace(',', '')
            .trim()
        );
      }
      return '';
    };

    return {
      targetHotel: getTargetHotel(),
      guestName: getGuestName(),
      checkInDate: getCheckInDate(),
      checkOutDate: getCheckOutDate(),
      totalToPay: getTotalToPay(),
      targetReservationId: getReservationIdTarget(),
      invoiceFiscalCodeTarget: getInvoiceRFCTarget(),
      invoiceEmailTarget: getInvoiceEmails(),
    } as CouponExtraction;
  }

  private extractGBTData(text: string): CouponExtraction {
    const { GBT_TRAVEL_SERVICES } = COUPONS_PROVIDERS_PATTERNS;
    const getTargetHotel = () => {
      const match = text.match(GBT_TRAVEL_SERVICES.TARGET_HOTEL);
      if (match) {
        return match[0].trim();
      }
      return '';
    };

    const getGuestName = () => {
      const match = text.match(GBT_TRAVEL_SERVICES.GUEST_NAME);
      if (match) {
        return match[1].trim();
      }
      return '';
    };

    const getCheckInDate = () => {
      const match = text.match(GBT_TRAVEL_SERVICES.CHECK_IN);
      if (match) {
        return match;
      }
      return '';
    };

    const getReservationIdTarget = () => {
      const match = text.match(GBT_TRAVEL_SERVICES.RESERVATION_ID_TARGET);
      if (match) {
        return match;
      }
      return '';
    };

    const getInvoiceRFCTarget = () => {
      const match = text.match(GBT_TRAVEL_SERVICES.INVOICE_RFC_TARGET);
      if (match) {
        return match[0];
      }
      return '';
    };

    const getInvoiceEmails = () => {
      const match = text.match(GBT_TRAVEL_SERVICES.INVOICE_EMAIL_TARGET);
      if (match) {
        return match;
      }
      return '';
    };

    return {
      targetHotel: getTargetHotel(),
      guestName: getGuestName(),
      checkInDate: getCheckInDate(),
      checkOutDate: '', // Not available in GBT data
      totalToPay: 0, // Not available in GBT data
      targetReservationId: getReservationIdTarget(),
      invoiceFiscalCodeTarget: getInvoiceRFCTarget(),
      invoiceEmailTarget: getInvoiceEmails(),
    } as CouponExtraction;
  }
}

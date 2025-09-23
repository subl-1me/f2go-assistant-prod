import {
  CORPORATE_TRAVEL_SERVICES,
  VIAJES_EL_CORTE_INGLES,
  ACCESS,
  GBT_TRAVEL_SERVICES,
  NOKTOS,
  BCD_TRAVEL,
} from '../const';

import { COUPONS_PROVIDERS_PATTERNS } from '../Patterns';

interface CouponExtraction {
  targetHotel: string;
  targetReservationId: string;
  checkInDate: string;
  checkOutDate: string;
  totalToPay: number;
  baseRate?: number;
  guestName: string;
  invoiceFiscalCodeTarget: string;
  invoiceEmailTarget: string[];
}

const monthsByPrefix: any = {
  ENE: '01',
  FEB: '02',
  MAR: '03',
  APR: '04',
  MAY: '05',
  JUN: '06',
  JUL: '07',
  AUG: '08',
  SEP: '09',
  OCT: '10',
  NOV: '11',
  DEC: '12',
};

const monthsByPrefixESP: any = {
  ENERO: '01',
  FEBRERO: '02',
  MARZO: '03',
  ABRIL: '04',
  MAYO: '05',
  JUNIO: '06',
  JULIO: '07',
  AGOSTO: '08',
  SEPTIEMBRE: '09',
  OCTUBRE: '10',
  NOVIEMBRE: '11',
  DICIEMBRE: '12',
};

export default class CouponDataExtraction {
  provider: string;
  text: string;

  constructor(provider: string, text: string) {
    this.provider = provider;
    this.text = text;
  }

  public extract(): any {
    switch (this.provider) {
      case CORPORATE_TRAVEL_SERVICES:
        return this.extractCorporateTravelServices();
      case BCD_TRAVEL:
        return this.extractBCDTravel();
      case VIAJES_EL_CORTE_INGLES:
        return this.extractViajesElCorteIngles();
      case NOKTOS:
        return this.extractNoktos();
      case ACCESS:
        return this.extractCityAccess();
      case GBT_TRAVEL_SERVICES:
        return this.extractGBTTravelServices();
      default:
        break;
    }
  }

  private extractBCDTravel(): CouponExtraction {
    const { BCD_TRAVEL } = COUPONS_PROVIDERS_PATTERNS;

    const getTargetHotel = () => {
      let hotelName = '';
      const match = this.text.match(BCD_TRAVEL.TARGET_HOTEL);
      if (match) {
        hotelName = match[0];
      }
      return hotelName;
    };

    const getGuestName = () => {
      let guestName = '';
      const match = this.text.match(BCD_TRAVEL.GUEST_NAME);
      if (match) {
        const name = match[0].replace('NAMES\n', '').replace(/\//, ' ');
        guestName = name;
      }

      return guestName;
    };

    const getDateIn = () => {
      let dateIn = '';
      const match = this.text.match(BCD_TRAVEL.CHECK_IN);
      if (match) {
        const rawDateSegments = match[1].split('/').reverse();
        [rawDateSegments[1], rawDateSegments[2]] = [
          rawDateSegments[2],
          rawDateSegments[1],
        ];
        dateIn = rawDateSegments.join('/');
      }

      return dateIn;
    };

    const getDateOut = () => {
      let dateOut = '';
      const match = this.text.match(BCD_TRAVEL.CHECK_OUT);
      if (match) {
        const rawDateSegments = match[2].split('/').reverse();
        [rawDateSegments[1], rawDateSegments[2]] = [
          rawDateSegments[2],
          rawDateSegments[1],
        ];
        dateOut = rawDateSegments.join('/');
      }

      return dateOut;
    };

    const getReservationId = () => {
      let id = '';
      const match = this.text.match(BCD_TRAVEL.RESERVATION_ID_TARGET);
      if (match) {
        id = match[0];
      }

      return id;
    };

    const getInvoiceRFCTarget = () => {
      let rfc = '';
      const match = this.text.match(BCD_TRAVEL.INVOICE_RFC_TARGET);
      if (match) {
        rfc = match[0].replace('-', '');
      }

      return rfc;
    };

    const getInvoiceEmails = () => {
      let emails: string[] = [];
      const match = this.text.match(BCD_TRAVEL.INVOICE_EMAIL_TARGET);
      if (match) {
        emails.push(match[0]);
      }

      return emails;
    };

    const getTotalAmount = () => {
      let totalAmount = 0;
      const match = this.text.match(
        BCD_TRAVEL.TOTAL_AMOUNT || /\d{4}\.\d{2}|\d+[^\s+MXN]/
      );
      if (match) {
        totalAmount = Number(match[1]);
      }

      return totalAmount;
    };

    const getBaseRate = () => {
      let baseRateAmount = 0;
      const match = this.text.match(
        BCD_TRAVEL.BASE_RATE || /\d{4}\.\d{2}|\d+[^\s+MXN]/
      );
      if (match) {
        baseRateAmount = Number(match[0]);
      }

      return baseRateAmount;
    };

    return {
      targetHotel: getTargetHotel(),
      guestName: getGuestName(),
      checkInDate: getDateIn(),
      checkOutDate: getDateOut(),
      targetReservationId: getReservationId(),
      invoiceFiscalCodeTarget: getInvoiceRFCTarget(),
      invoiceEmailTarget: getInvoiceEmails(),
      totalToPay: getTotalAmount(), // Not available in CTS data
      baseRate: getBaseRate(),
    } as CouponExtraction;
  }

  private extractNoktos(): CouponExtraction {
    const { NOKTOS } = COUPONS_PROVIDERS_PATTERNS;
    const getTargetHotel = () => {
      let target = '';
      const match = this.text.match(NOKTOS.TARGET_HOTEL);
      if (match) {
        target = match[0];
      }

      return target;
    };

    const getGuestName = () => {
      let guestName = '';
      const match = this.text.match(NOKTOS.GUEST_NAME);
      if (match) {
        guestName = match[0].trim();
      }

      return guestName;
    };

    const getReservationId = () => {
      let id = '';
      const match = this.text.match(NOKTOS.RESERVATION_ID_TARGET);
      if (match) {
        id = match[0];
      }

      return id;
    };

    const getCheckInDate = () => {
      let dateIn = '';
      const match = this.text.match(NOKTOS.CHECK_IN);
      if (match) {
        const dateRaw = match[0];
        const sanitizedDate = dateRaw.replace('\n', '').replace(/-/g, '/');
        dateIn = sanitizedDate;
      }
      return dateIn;
    };

    const getCheckOutDate = () => {
      let dateOut = '';
      const match = this.text.match(NOKTOS.CHECK_OUT);
      if (match) {
        const dateRaw = match[1];
        const sanitizedDate = dateRaw.replace('\n', '').replace(/-/g, '/');
        dateOut = sanitizedDate;
      }
      return dateOut;
    };

    return {
      targetHotel: getTargetHotel(),
      guestName: getGuestName(),
      checkInDate: getCheckInDate(),
      checkOutDate: getCheckOutDate(),
      targetReservationId: getReservationId(),
      invoiceFiscalCodeTarget: '',
      invoiceEmailTarget: [],
      totalToPay: 0, // Not available in CTS data
    } as CouponExtraction;
  }

  private extractCTSTravel(): CouponExtraction {
    const { CORPORATE_TRAVEL_SERVICES } = COUPONS_PROVIDERS_PATTERNS;
    const getTargetHotelName = () => {
      const targetMatch = this.text.match(
        CORPORATE_TRAVEL_SERVICES.TARGET_HOTEL
      );
      if (targetMatch) {
        return targetMatch[0];
      }
      return '';
    };

    const getTargetGuestName = () => {
      const guestNameMatch = this.text.match(
        CORPORATE_TRAVEL_SERVICES.GUEST_NAME
      );
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
      const checkInMatch = this.text.match(CORPORATE_TRAVEL_SERVICES.CHECK_IN);
      if (checkInMatch) {
        const checkIn = checkInMatch[0].replace('CHECK IN DATE', '').trim();
        return checkIn;
      }
      return '';
    };

    const getCheckOutDates = () => {
      const checkInMatch = this.text.match(CORPORATE_TRAVEL_SERVICES.CHECK_OUT);
      if (checkInMatch) {
        const checkIn = checkInMatch[0].replace('CHECK OUT DATE:', '').trim();
        return checkIn;
      }
      return '';
    };

    const getReservationIdTarget = () => {
      const reservationIdMatch = this.text.match(
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
      const RFCTargetMatch = this.text.match(
        CORPORATE_TRAVEL_SERVICES.INVOICE_RFC_TARGET
      );
      if (RFCTargetMatch) {
        return RFCTargetMatch[0];
      }

      return '';
    };

    const getInvoiceEmailTarget = () => {
      const emailTargetMatch = this.text.match(
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

  private extractViajesElCorteIngles(): CouponExtraction {
    const { VIAJES_EL_CORTE_INGLES } = COUPONS_PROVIDERS_PATTERNS;
    const getTargetHotelName = () => {
      const targetMatch = this.text.match(VIAJES_EL_CORTE_INGLES.TARGET_HOTEL);
      if (targetMatch) {
        return targetMatch[0];
      }
      return '';
    };

    const getTargetGuestName = () => {
      const guestNameMatch = this.text.match(VIAJES_EL_CORTE_INGLES.GUEST_NAME);
      if (guestNameMatch) {
        const name = guestNameMatch[1].replace('/', ' ').trim();
        return name;
      }
      return '';
    };

    const getCheckInDates = () => {
      const checkInMatch = this.text.match(VIAJES_EL_CORTE_INGLES.CHECK_IN);
      if (checkInMatch) {
        // sanitize date string
        const checkInString = checkInMatch[0]
          .replace('FECHA:', '')
          .replace(',', '');
        let checkInSegments = checkInString.trim().split(' ').reverse();
        [checkInSegments[1], checkInSegments[2]] = [
          checkInSegments[2],
          checkInSegments[1],
        ];
        let dateIn = checkInSegments.join('/');
        const monthsEsp = Object.keys(monthsByPrefixESP);
        const monthEsp = monthsEsp.find((prefix: string) =>
          dateIn.includes(prefix)
        );

        if (monthEsp) {
          dateIn = dateIn.replace(monthEsp, monthsByPrefixESP[monthEsp]);
        }
        return dateIn;
      }
      return '';
    };

    const getCheckOutDates = () => {
      const checkOutMatch = this.text.match(VIAJES_EL_CORTE_INGLES.CHECK_OUT);
      if (checkOutMatch) {
        // sanitize date string
        const checkInString = checkOutMatch[0]
          .replace('SALIDA:', '')
          .replace(',', '');
        let checkInSegments = checkInString.trim().split(' ').reverse();
        [checkInSegments[1], checkInSegments[2]] = [
          checkInSegments[2],
          checkInSegments[1],
        ];
        let dateIn = checkInSegments.join('/');
        const monthsEsp = Object.keys(monthsByPrefixESP);
        const monthEsp = monthsEsp.find((prefix: string) =>
          dateIn.includes(prefix)
        );

        if (monthEsp) {
          dateIn = dateIn.replace(monthEsp, monthsByPrefixESP[monthEsp]);
        }
        return dateIn;
      }
      return '';
    };

    const getReservationIdTarget = () => {
      const reservationIdMatch = this.text.match(
        VIAJES_EL_CORTE_INGLES.RESERVATION_ID_TARGET
      );
      if (reservationIdMatch) {
        const matchResult = reservationIdMatch[0].match(/\d{8}/);
        const reservationIdTarget = matchResult ? matchResult[0] : '';
        return reservationIdTarget;
      }

      return '';
    };

    const getInvoiceRFCTarget = () => {
      const RFCTargetMatch = this.text.match(
        VIAJES_EL_CORTE_INGLES.INVOICE_RFC_TARGET
      );
      if (RFCTargetMatch) {
        return RFCTargetMatch[0];
      }

      return '';
    };

    const getInvoiceEmailTarget = () => {
      const emailTargetMatch = this.text.match(
        VIAJES_EL_CORTE_INGLES.INVOICE_EMAIL_TARGET
      );
      if (emailTargetMatch) {
        return emailTargetMatch;
      }

      return [];
    };

    const getTotalAmount = () => {
      const totalAmountMatch = this.text.match(
        VIAJES_EL_CORTE_INGLES.TOTAL_AMOUNT || ''
      );
      if (totalAmountMatch) {
        const amountMatch = totalAmountMatch[0].match(/\d+\.\d+|\d+/);
        const amount = Number(amountMatch ? amountMatch[0] : 0);
        if (
          totalAmountMatch[0].includes('+ IMPS POR NOCHE') ||
          totalAmountMatch[0].includes('TOTAL ESTANCIA')
        ) {
          return Number(amount);
        } else {
          return Number(parseFloat((amount * 1.12).toString()));
        }
      }

      return 0;
    };

    return {
      targetHotel: getTargetHotelName(),
      guestName: getTargetGuestName(),
      checkInDate: getCheckInDates(),
      checkOutDate: getCheckOutDates(),
      targetReservationId: getReservationIdTarget(),
      invoiceFiscalCodeTarget: getInvoiceRFCTarget(),
      invoiceEmailTarget: getInvoiceEmailTarget(),
      totalToPay: getTotalAmount(), // Not available in CTS data
    } as CouponExtraction;
  }

  private extractCorporateTravelServices(): CouponExtraction {
    const { CORPORATE_TRAVEL_SERVICES } = COUPONS_PROVIDERS_PATTERNS;
    const getTargetHotelName = () => {
      const targetMatch = this.text.match(
        CORPORATE_TRAVEL_SERVICES.TARGET_HOTEL
      );
      if (targetMatch) {
        return targetMatch[0];
      }

      return '';
    };

    const getTargetGuestName = () => {
      const guestNameMatch = this.text.match(
        CORPORATE_TRAVEL_SERVICES.GUEST_NAME
      );
      if (guestNameMatch) {
        return guestNameMatch[0].replace('TITULAR\n', '');
      }

      return '';
    };

    const getCheckInDates = () => {
      const checkInMatch = this.text.match(CORPORATE_TRAVEL_SERVICES.CHECK_IN);
      if (checkInMatch) {
        const checkIn = checkInMatch[0]
          .replace('FECHADEENTRADA:', '')
          .trim()
          .split('/')
          .reverse()
          .join('/');
        return checkIn;
      }
      return '';
    };

    const getCheckOutDates = () => {
      const checkInMatch = this.text.match(CORPORATE_TRAVEL_SERVICES.CHECK_OUT);
      if (checkInMatch) {
        const checkIn = checkInMatch[0]
          .replace('FECHADESALIDA:', '')
          .trim()
          .split('/')
          .reverse()
          .join('/');
        return checkIn;
      }
      return '';
    };

    const getReservationIdTarget = () => {
      const reservationIdMatch = this.text.match(
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
      const RFCTargetMatch = this.text.match(
        CORPORATE_TRAVEL_SERVICES.INVOICE_RFC_TARGET
      );
      if (RFCTargetMatch) {
        return RFCTargetMatch[0];
      }

      return '';
    };

    const getInvoiceEmailTarget = () => {
      const emailTargetMatch = this.text.match(
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

  private extractCityAccess(): CouponExtraction {
    const { CITY_ACCESS } = COUPONS_PROVIDERS_PATTERNS;
    const getTargetHotel = () => {
      const match = this.text.match(CITY_ACCESS.TARGET_HOTEL);
      if (match) {
        const targetHotel = match[0].replace('HOTEL', '').trim();
        return targetHotel;
      }

      return '';
    };

    const getGuestName = () => {
      const match = this.text.match(CITY_ACCESS.GUEST_NAME);
      if (match) {
        const guestName = match[0].replace('NOMBRE DEL HUÉSPED', '').trim();
        return guestName;
      }

      return '';
    };

    const getCheckInDate = () => {
      const match = this.text.match(CITY_ACCESS.CHECK_IN);
      if (match) {
        return match[0]
          .replace('FECHA DE ENTRADA', '')
          .replace(/-/g, '/')
          .trim();
      }

      return '';
    };

    const getCheckOutDate = () => {
      const match = this.text.match(CITY_ACCESS.CHECK_OUT);
      if (match) {
        return match[0]
          .replace('FECHA DE SALIDA', '')
          .replace(/-/g, '/')
          .trim();
      }
      return '';
    };

    const getReservationIdTarget = () => {
      const match = this.text.match(CITY_ACCESS.RESERVATION_ID_TARGET);
      if (match) {
        return match[0].replace('CLAVE DE CONFIRMACIÓN', '').trim();
      }
      return '';
    };

    const getInvoiceRFCTarget = () => {
      const match = this.text.match(CITY_ACCESS.INVOICE_RFC_TARGET);
      if (match) {
        return match[0];
      }
      return '';
    };

    const getInvoiceEmails = () => {
      const match = this.text.match(CITY_ACCESS.INVOICE_EMAIL_TARGET);
      if (match) {
        return match;
      }
      return '';
    };

    const getTotalToPay = () => {
      if (!CITY_ACCESS.BASE_RATE) {
        return '';
      }

      const match = this.text.match(CITY_ACCESS.BASE_RATE);
      if (match) {
        return Number(
          match[0]
            .replace('TARIFA', '')
            .replace('$', '')
            .replace(',', '')
            .replace(/\s+/g, ' ')
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

  private extractGBTTravelServices(): CouponExtraction {
    // console.log(this.text);
    const { GBT_TRAVEL_SERVICES } = COUPONS_PROVIDERS_PATTERNS;
    const getTargetHotel = () => {
      const match = this.text.match(GBT_TRAVEL_SERVICES.TARGET_HOTEL);
      if (match) {
        return match[0].trim();
      }
      return '';
    };

    const getCheckInDate = () => {
      const match = this.text.match(GBT_TRAVEL_SERVICES.CHECK_IN);
      if (match && match.length >= 3) {
        // sanitize
        let date = match[1].replace(/-/g, '/');
        const keys = Object.keys(monthsByPrefix);
        const month = keys.find((key) => date.includes(key));
        if (month) {
          date = date.replace(new RegExp(month), monthsByPrefix[month]);
        }
        return date.split('/').reverse().join('/');
      }
      return '';
    };

    const getCheckOutDate = () => {
      const match = this.text.match(GBT_TRAVEL_SERVICES.CHECK_IN);
      if (match && match.length >= 3) {
        // sanitize
        let date = match[2].replace(/-/g, '/');
        const keys = Object.keys(monthsByPrefix);
        const month = keys.find((key) => date.includes(key));
        if (month) {
          date = date.replace(new RegExp(month), monthsByPrefix[month]);
        }
        return date.split('/').reverse().join('/');
      }
      return '';
    };

    const getReservationIdTarget = () => {
      const match = this.text.match(GBT_TRAVEL_SERVICES.RESERVATION_ID_TARGET);
      if (match) {
        return match[0];
      }
      return '';
    };

    const getInvoiceRFCTarget = () => {
      const match = this.text.match(GBT_TRAVEL_SERVICES.INVOICE_RFC_TARGET);
      if (match) {
        return match[0].replace(/-/g, '');
      }
      return '';
    };

    const getInvoiceEmails = () => {
      const match = this.text.match(GBT_TRAVEL_SERVICES.INVOICE_EMAIL_TARGET);
      if (match) {
        return match;
      }
      return '';
    };

    let totalAmount = 0;
    let baseRate = 0;

    const getRates = () => {
      const match = this.text.match(
        GBT_TRAVEL_SERVICES.TOTAL_AMOUNT || /\$\d+,\d+/
      );
      if (match) {
        const sanitizedAmounts = match.map((m) =>
          Number(parseFloat(m.replace(/[\$,]/g, '').trim()).toFixed(2))
        );

        totalAmount = sanitizedAmounts.reduce((max, current) => {
          return current > max ? current : max;
        }, sanitizedAmounts[0]);

        baseRate = sanitizedAmounts[0];
      }
    };

    getRates();

    return {
      targetHotel: getTargetHotel(),
      guestName: '', // not possible
      checkInDate: getCheckInDate(),
      checkOutDate: getCheckOutDate(),
      totalToPay: totalAmount,
      baseRate,
      targetReservationId: getReservationIdTarget(),
      invoiceFiscalCodeTarget: getInvoiceRFCTarget(),
      invoiceEmailTarget: getInvoiceEmails(),
    } as CouponExtraction;
  }
}

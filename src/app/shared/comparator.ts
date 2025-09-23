import { environment } from '../../environment';
import Comparation from '../models/Comparation';
import CouponExtraction from '../models/CouponExtraction';
import Reservation from '../models/Reservation';

export default class Comparator {
  reservation: Reservation;
  couponData: CouponExtraction;

  constructor(reservation: Reservation, couponData: CouponExtraction) {
    this.reservation = reservation;
    this.couponData = couponData;
  }

  public compare(): Comparation {
    const {
      targetHotel,
      guestName,
      checkInDate,
      checkOutDate,
      targetReservationId,
    } = this.couponData;

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

    const reservationIdSimilarity = () => {
      let similarity;
      similarity = this.reservation.marriotId === targetReservationId ? 1 : 0.8;
      if (similarity < 1) {
        similarity =
          this.reservation.marriotId === targetReservationId ? 1 : 0.8; // case marriotId is not defined
      }

      return {
        similarity,
        fields: [
          targetReservationId,
          this.reservation.marriotId !== ''
            ? this.reservation.marriotId
            : this.reservation.id,
        ],
      };
    };

    // Compare guest names
    const guestNameSimilarity = () => {
      const normalizedGuest = guestName
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

      const similarity =
        normalizedGuest === this.reservation.guestName.toUpperCase() ? 1 : 0.8;
      return {
        similarity,
        fields: [normalizedGuest, this.reservation.guestName],
      };
    };

    // Compare check-in dates
    const checkInDateSimilarity = () => {
      const normalizedCheckIn = checkInDate
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

      const similarity =
        normalizedCheckIn === this.reservation.dateIn.toUpperCase() ? 1 : 0.8;
      return {
        similarity,
        fields: [normalizedCheckIn, this.reservation.dateIn],
      };
    };

    // Compare check-out dates
    const checkOutDateSimilarity = () => {
      const normalizedCheckOut = checkOutDate
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

      const similarity =
        normalizedCheckOut === this.reservation.dateOut.toUpperCase() ? 1 : 0.8;
      return {
        similarity,
        fields: [normalizedCheckOut, this.reservation.dateOut],
      };
    };

    // Calculate overall similarity score
    const overallSimilarity =
      hotelNameSimilarity().similarity +
      guestNameSimilarity().similarity +
      checkInDateSimilarity().similarity +
      checkOutDateSimilarity().similarity +
      reservationIdSimilarity().similarity / 5;

    return {
      hotelName: hotelNameSimilarity(),
      guestName: guestNameSimilarity(),
      checkIn: checkInDateSimilarity(),
      checkOut: checkOutDateSimilarity(),
      reservationId: reservationIdSimilarity(),
      overallSimilarity,
    } as Comparation;
  }
}

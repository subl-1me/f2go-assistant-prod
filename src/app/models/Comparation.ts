export default interface Comparation {
  hotelName: similarity;
  guestName: similarity;
  checkIn: similarity;
  checkOut: similarity;
  overallSimilarity: number;
}

interface similarity {
  similarity: number;
  fields: string[];
}

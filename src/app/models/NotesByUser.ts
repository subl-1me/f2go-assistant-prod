export default interface NotesByUser {
  reservationId: string;
  id: string;
  notes: string[];
  user: string;
  createdAt: Date;
  type: string;
}

import { Injectable } from '@angular/core';
import * as sqlite3 from 'sqlite3';
import path from 'path';

@Injectable({
  providedIn: 'root',
})
export class LocalDatabaseService {
  private dbPath: string;
  private db!: sqlite3.Database;

  constructor() {
    this.dbPath = path.join(__dirname, 'src', 'db', 'reservations-cache.db');
  }

  public initDatabase(): void {
    console.log('Initializing cache database...');

    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Error creating reservations cache database:', err);
      }
    });

    this.createTables();
  }

  private createTables(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS cache(
        no INTEGER PRIMARY KEY AUTOINCREMENT,
        reservationId TEXT NOT NULL UNIQUE,
        marriottId TEXT NOT NULL UNIQUE,
        guestName TEXT NOT NULL,
        dateIn TEXT NOT NULL,
        dateOut TEXT NOT NULL,
        checkedAt TEXT NOT NULL,
        checkAgainAt TEXT NOT NULL,
        checkStatus TEXT NOT NULL,
        indicators TEXT NOT NULL,
        paymentMethod TEXT NOT NULL,
        paymentStatus TEXT NOT NULL,
        room INTEGER NOT NULL,
        documents TEXT NOT NULL,
        ledgersStatus TEXT NOT NULL,
      )
      `);
  }
}

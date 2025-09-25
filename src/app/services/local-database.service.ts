import { Injectable } from '@angular/core';
import * as sqlite3 from 'sqlite3';
import { app } from 'electron';
import { join } from 'path';

@Injectable({
  providedIn: 'root',
})
export class LocalDatabaseService {
  private db!: sqlite3.Database;
  private isInitialized = false;

  constructor() {}

  public async initDatabase(databasePath: string): Promise<void> {
    if (this.isInitialized) {
      return; //
    }
    console.log('Initializing cache database...');

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(databasePath, (err) => {
        if (err) {
          console.error('Error creating database:', err);
          reject(err);
          return;
        }

        this.isInitialized = true;
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  private async createTables(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `
        CREATE TABLE IF NOT EXISTS cache(
          no INTEGER PRIMARY KEY AUTOINCREMENT,
          reservationId TEXT NOT NULL UNIQUE,
          marriottId TEXT NOT NULL UNIQUE,
          guestName TEXT NOT NULL,
          room INTEGER NOT NULL,
          dateIn TEXT NOT NULL,
          dateOut TEXT NOT NULL,
          paymentStatus TEXT NOT NULL,
          paymentMethod TEXT NOT NULL,
          ledgersStatus TEXT NOT NULL,
          checkStatus TEXT NOT NULL,
          documents TEXT NOT NULL,
          activeCoupons TEXT NOT NULL,
          checkedAt TEXT NOT NULL,
          checkAgainAt TEXT NOT NULL,
          indicators TEXT NOT NULL
        )
      `,
        (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Tables created/verified');
            resolve();
          }
        }
      );
    });
  }

  public async insertReservation(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO cache (
          reservationId, marriottId, guestName, room, dateIn, dateOut,
          paymentStatus, paymentMethod, ledgersStatus, checkStatus,
          documents, checkedAt, checkAgainAt, indicators
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.reservationId,
          data.marriottId,
          data.guestName,
          data.room,
          data.dateIn,
          data.dateOut,
          data.paymentStatus,
          data.paymentMethod,
          data.ledgersStatus,
          data.checkStatus,
          data.documents,
          data.checkedAt,
          data.checkAgainAt,
          data.indicators,
        ],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  public async getReservation(reservationId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM cache WHERE reservationId = ?',
        [reservationId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }
}

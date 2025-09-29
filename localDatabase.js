import sqlite3 from "sqlite3";
import path from "path";
import { app } from "electron";
import fs from "fs";

const checkerCacheDBPath = path.join(
  app.getPath("userData"),
  "rsrvs-checker-cache.db"
);

let checkerDb;

export const initDatabases = async () => {
  console.log("Initializing cache database...");

  // Crear carpeta si no
  const dir = path.dirname(checkerCacheDBPath);
  console.log(checkerCacheDBPath);
  console.log(dir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    checkerDb = new sqlite3.Database(checkerCacheDBPath, (err) => {
      if (err) {
        console.error("Error creating database:", err);
        reject(err);
        return;
      }
      createRsrvsCheckerTables().then(resolve).catch(reject);
    });
  });
};

export const write = async (data) => {
  return new Promise((resolve, reject) => {
    try {
      const stmt = checkerDb.prepare(
        `
      INSERT INTO cache (reservation, checkStatus, paymentStatus, documents, ledgersStatus, lastCheck, prePaidMethod, activeCoupons, checkAgainAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      stmt.run(
        JSON.stringify(data.reservation),
        data.checkStatus,
        data.paymentStatus,
        JSON.stringify(data.documents || []),
        JSON.stringify(data.ledgersStatus),
        data.lastCheck,
        JSON.stringify(data.prePaidMethod || {}),
        JSON.stringify(data.activeCoupons || []),
        data.checkAgainAt
      );

      stmt.finalize();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

export const read = async () => {
  return new Promise((resolve, reject) => {
    checkerDb.all("SELECT * FROM cache", [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const createRsrvsCheckerTables = async () => {
  return new Promise((resolve, reject) => {
    checkerDb.run(
      `
        CREATE TABLE IF NOT EXISTS cache(
          no INTEGER PRIMARY KEY AUTOINCREMENT,
          reservation TEXT NOT NULL,
          checkStatus TEXT NOT NULL,
          paymentStatus TEXT NOT NULL,
          documents TEXT NOT NULL,
          ledgersStatus TEXT NOT NULL,
          activeCoupons TEXT NOT NULL,
          lastCheck DATE NOT NULL,
          prePaidMethod TEXT NOT NULL,
          checkAgainAt DATE NOT NULL
        )
      `,
      (err) => {
        if (err) {
          reject(err);
        } else {
          console.log("Tables created/verified");
          resolve();
        }
      }
    );
  });
};

export const removeReservationsCache = async () => {
  return new Promise((resolve, reject) => {
    try {
      const stmt = checkerDb.prepare(`DELETE FROM cache;`);
      stmt.run();
      stmt.finalize();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
};

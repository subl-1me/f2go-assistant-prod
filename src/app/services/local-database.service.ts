import { Injectable } from '@angular/core';
import StandardCheckResult from '../models/StandardCheckResult';

@Injectable({
  providedIn: 'root',
})
export class LocalDatabaseService {
  constructor() {}

  public async loadCache(): Promise<StandardCheckResult[]> {
    const data = await window.electron.ipcRenderer.invoke('read');
    const cache = data.map((result: any) => {
      return {
        reservation: JSON.parse(result.reservation),
        documents: JSON.parse(result.documents),
        paymentStatus: result.paymentStatus,
        checkStatus: result.checkStatus,
        lastCheck: result.lastCheck,
        checkAgainAt: result.checkAgainAt,
        prePaidMethod: JSON.parse(result.prePaidMethod),
        activeCoupons: JSON.parse(result.activeCoupons),
        ledgersStatus: JSON.parse(result.ledgersStatus),
        routing: JSON.parse(result.routing || {}),
      } as StandardCheckResult;
    });

    return cache;
  }
}

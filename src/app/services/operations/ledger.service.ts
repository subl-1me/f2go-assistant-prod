import { Injectable } from '@angular/core';
import Ledger from '../../models/Ledger';
import { environment } from '../../../environment';
import { FrontService } from '../front-service';
import Reservation from '../../models/Reservation';
import Transaction from '../../models/Transaction';
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class LedgerService {
  constructor(private frontService: FrontService) {}

  public getReservationledger(reservationId: string): Promise<Ledger[]> {
    const API_URI = environment.FRONT_API_GET_RSRV_LEDGERS.replace(
      '{idField}',
      reservationId
    ).replace('{propName}', environment.PROP_NAME);

    return new Promise<Ledger[]>((resolve, reject) => {
      this.frontService.getRequest(API_URI).subscribe({
        next: (response) => {
          if (response.status === 401) {
            reject('Authentication error.');
          } else {
            const items = JSON.parse(response);
            resolve(
              items.map((item: any, index: number): Ledger => {
                return {
                  reservationId,
                  ledgerNo: item.numFolio,
                  isPrincipal: index === 0,
                  status: item.folioStatus,
                  balance: item.folioBalance,
                  isBalanceCredit: item.balance < 0,
                  transactions: [],
                  isInvoiced: false,
                };
              })
            );
          }
        },
        error: (err) => reject(err),
      });
    });
  }

  public async getLedgerTransactions(ledger: Ledger): Promise<Transaction[]> {
    const API_URI = environment.FRONT_API_GET_RSRV_LEDGER_TRANSACTIONS.replace(
      '{ledgerCode}',
      `${ledger.reservationId}.${ledger.ledgerNo}`
    ).replace('{propName}', environment.PROP_NAME || 'none');

    return new Promise<Transaction[]>((resolve, reject) => {
      this.frontService.postRequest(API_URI).subscribe({
        next: (response) => {
          if (response.status === 401) {
            reject('Authentication error.');
          } else {
            const items = JSON.parse(response);
            resolve(
              items.map((item: any, index: number): Transaction => {
                let transType = item.transType.includes('P ')
                  ? 'PAYMENT'
                  : 'CHARGE';
                return {
                  transactionId: item.postId,
                  type: transType,
                  code: item.transCode,
                  isRefund:
                    transType === 'PAYMENT' && item.postAmount > 0
                      ? true
                      : false,
                  amount: item.postAmount,
                  date: item.dateCreate,
                };
              })
            );
          }
        },
        error: (err) => reject(err),
      });
    });
  }

  public async classifyLedgers(ledgers: Ledger[]): Promise<any> {}
}

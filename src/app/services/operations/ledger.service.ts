import { Injectable } from '@angular/core';
import Ledger from '../../models/Ledger';
import { environment } from '../../../environment';
import { FrontService } from '../front-service';
import Transaction from '../../models/Transaction';
import { ReservationService } from './reservation.service';
import { ledgerQueue } from '../../utils/queues';
import { InvoiceService } from './invoice.service';
import LedgerCheckerResponse from '../../models/LedgerCheckerResponse';
import LedgerClassification from '../../models/LedgerClassification';

type SecureLedger = Omit<Ledger, 'transactions'>;

@Injectable({
  providedIn: 'root',
})
export class LedgerService {
  constructor(
    private frontService: FrontService,
    private reservationService: ReservationService,
    private invoiceService: InvoiceService
  ) {}

  private createSecureTypedLedger(ledger: Ledger): SecureLedger {
    const { transactions, ...secureLedger } = ledger;
    return secureLedger;
  }

  public async getReservationledger(reservationId: string): Promise<Ledger[]> {
    const API_URI = environment.FRONT_API_GET_RSRV_LEDGERS.replace(
      '{idField}',
      reservationId
    ).replace('{propName}', environment.PROP_NAME);

    const task = async () => {
      return new Promise<any>((resolve, reject) => {
        this.frontService.getRequest(API_URI).subscribe({
          next: (response) => {
            const items = JSON.parse(response);
            const ledgers = items.map((item: any, index: number): Ledger => {
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
            });
            resolve({ error: false, ledgers });
          },
          error: (err) => reject(err),
        });
      });
    };

    try {
      const taskResult = await ledgerQueue.addRequest(task);
      if (taskResult.error || !taskResult.ledgers) {
        return [];
      }

      return taskResult.ledgers;
    } catch (err) {
      console.log('Failed to fetch ledger: ', err);
      return [];
    }
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

  public async classifyLedgers(ledgers: Ledger[]): Promise<any> {
    const reservationId = ledgers[0].reservationId;
    const invoices = await this.invoiceService.getReservationInvoices(
      reservationId
    );

    ledgers.forEach((ledger) => {
      const invoice = invoices.find(
        (invoice) => invoice.ledgerNo === ledger.ledgerNo
      );
      if (invoice) {
        ledger.invoice = invoice;
        ledger.isInvoiced = true;
      }
    });

    const active = ledgers.filter((ledger) =>
      ledger.transactions.find(
        (trans) => trans.type === 'PAYMENT' || trans.type === 'CHARGE'
      )
    );

    // re-mark principal ledger
    if (active.length > 0) {
      ledgers.forEach((ledger) => {
        ledger.isPrincipal = false;
      });

      active[0].isPrincipal = true;
    }

    const inactive = ledgers.filter(
      (ledger) => ledger.transactions.length === 0 && ledger.status === 'OPEN'
    );

    const invoiced = ledgers.filter(
      (ledger) =>
        ledger.isInvoiced && ledger.invoice && ledger.status === 'CLOSED'
    );

    const invoicable = ledgers.filter(
      (ledger) =>
        !ledger.invoice &&
        !ledger.isInvoiced &&
        ledger.balance === 0 &&
        ledger.transactions.find((ledger) => ledger.type === 'PAYMENT')
    );

    const nousable = ledgers.filter(
      (ledger) => ledger.transactions.length === 0 && ledger.status === 'CLOSED'
    );

    return {
      active,
      inactive,
      invoiced,
      invoicable,
      nousable,
    };
  }

  public async checkLedgers(
    ledgers: Ledger[],
    reservationId: string
  ): Promise<LedgerCheckerResponse> {
    let response: LedgerCheckerResponse = {
      error: false,
      errors: [],
      isPendingToPay: true,
      isFullyPaid: false,
      isPartialPay: false,
      isTodayPaid: false,
      ledgersPendingToPay: [],
      ledgersPaid: [],
      classification: {
        active: [],
        inactive: [],
        invoicable: [],
        invoiced: [],
        nousable: [],
      },
    };

    const classification = await this.classifyLedgers(ledgers);
    response.classification = classification;
    const { active } = classification;

    // get reservation rates
    const rates = await this.reservationService.getReservationRates(
      reservationId
    );

    const totalToPay = rates.reduce((accum, current) => {
      return (accum += current.amount);
    }, 0);

    const ledgersWithPayment = active.filter((ledger: Ledger) =>
      ledger.transactions.find((trans) => trans.type === 'PAYMENT')
    );

    ledgersWithPayment.forEach((ledger: Ledger) => {
      let totalPaymentsAmount = ledger.transactions.reduce((accum, current) => {
        if (current.type === 'PAYMENT') {
          return (accum += current.amount);
        }

        return (accum += 0);
      }, 0);

      totalPaymentsAmount = Math.abs(totalPaymentsAmount);
      // TODO: Check if total pymnt amount covers all reseservation
      if (totalPaymentsAmount === totalToPay) {
        response.isFullyPaid = true;
        response.isPendingToPay = false;
        response.ledgersPaid.push(ledger.ledgerNo);
      }

      // TODO: calculate how many nights the pymtn cover
      // Check if current night is paid
      const appDate = environment.APP_DATE;
      const todayRate = rates.find((rate) => rate.date === appDate);
      if (!todayRate) {
        response.error = true;
        response.errors.push({ message: 'Today rate not found.' });
      } else {
        if (totalPaymentsAmount >= todayRate.amount) {
          // today is covered
          response.isTodayPaid = true;
          response.isPendingToPay = false;
        }
      }

      // TODO: determinate if ledgers exceed of payments
      if (totalPaymentsAmount > totalToPay) {
        //TODO: Could be router
        response.error = true;
        response.isTodayPaid = true;
        response.isPendingToPay = false;
        const diff = parseFloat(
          (totalPaymentsAmount - totalToPay).toString()
        ).toFixed(2);
        response.errors.push({
          message: `Payments exceed reservation's total on ledger #${ledger.ledgerNo} for $${diff}`,
        });
      }
    });

    const ledgersWithOutPayment = active
      .filter(
        (ledger: Ledger) =>
          !ledger.transactions.find((trans) => trans.type === 'PAYMENT')
      )
      .map((ledger: Ledger) => ledger.ledgerNo);

    response.ledgersPendingToPay = [...ledgersWithOutPayment];

    // make secure reservation's ledgers by removing transactions object
    const activeSecure = classification.active.map((ledger: Ledger) =>
      this.createSecureTypedLedger(ledger)
    );
    const inactiveSecure = classification.inactive.map((ledger: Ledger) =>
      this.createSecureTypedLedger(ledger)
    );
    const invoicedSecure = classification.invoiced.map((ledger: Ledger) =>
      this.createSecureTypedLedger(ledger)
    );
    const invoicableSecure = classification.invoicable.map((ledger: Ledger) =>
      this.createSecureTypedLedger(ledger)
    );
    const nousableSecure = classification.nousable.map((ledger: Ledger) =>
      this.createSecureTypedLedger(ledger)
    );

    response.classification.active = [...activeSecure];
    response.classification.inactive = [...inactiveSecure];
    response.classification.invoiced = [...invoicedSecure];
    response.classification.invoicable = [...invoicableSecure];
    response.classification.nousable = [...nousableSecure];
    return response;
  }
}

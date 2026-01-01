import { Injectable } from '@angular/core';
import { FrontService } from '../front-service';
import { environment } from '../../../environment';
import { Observable } from 'rxjs';
import { defaultQueue } from '../../utils/queues';
import Extractor from '../../Extractor';
import Invoice from '../../models/Invoice';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  private extractor: Extractor;
  constructor(private frontService: FrontService) {
    this.extractor = new Extractor();
  }

  // make sure receptor is already registered on Front's API
  public searchForReceptor(receptorParam: string): Observable<any> {
    const receptor = receptorParam.toLocaleLowerCase();
    const receptorPayload = {
      sparam: receptor,
      facturacion: true,
      propcode: environment.PROP_NAME,
      targetfolio: '',
      ranticipo: '',
      fiscalname: '',
      fiscalid: '',
    };

    const response = this.frontService.postRequest(
      environment.FRONT_API_GET_FISCAL_RECEPTOR,
      receptorPayload,
      true
    );
    return response;
  }

  public async getReservationInvoices(
    reservationId: string
  ): Promise<Invoice[]> {
    const task = async () => {
      return new Promise((resolve, reject) => {
        const url = environment.FRONT_API_GET_INVOICES_PAGE.replace(
          '{rsrvId}',
          reservationId
        );
        this.frontService.getRequest(url).subscribe({
          next: (response) => {
            const text = response.rawData;
            const invoices = this.extractor.extractInvoices(text);
            resolve(invoices);
          },
          error: (error) => {
            reject(error);
          },
        });
      });
    };

    try {
      const response = await defaultQueue.addRequest(task);
      return response;
    } catch (err) {
      return [];
    }
  }
}

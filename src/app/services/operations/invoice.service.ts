import { Injectable } from '@angular/core';
import { FrontService } from '../front-service';
import { environment } from '../../../environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class InvoiceService {
  constructor(private frontService: FrontService) {}

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
}

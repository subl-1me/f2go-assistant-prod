import { Injectable } from '@angular/core';
import { inject } from '@angular/core';

import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpResponse,
} from '@angular/common/http';

import { Observable } from 'rxjs';
import { environment } from '../../environment.example';

@Injectable({
  providedIn: 'root',
})
export class ProxyService {
  private http = inject(HttpClient);

  constructor() {}

  extractPDFText(path: string): Observable<any> {
    return this.http.post(
      environment.PROXY_EXTRACT_PDF_TEXT,
      { path },
      {
        observe: 'response',
        responseType: 'json',
        withCredentials: true,
      }
    );
  }
}

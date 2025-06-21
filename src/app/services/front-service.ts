import { Injectable } from '@angular/core';
import { inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment';
import { HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FrontService {
  private http = inject(HttpClient);

  constructor() {}

  private handleResponse(response: HttpResponse<any>) {
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return response.body; // Angular ya parsea JSON automáticamente
    } else {
      // Para HTML, podrías convertirlo a un objeto con el texto y metadatos
      return {
        rawData: response.body,
        cookies:
          response.headers.get('x-extracted-cookies') ||
          response.headers.get('set-cookie') ||
          '',
        status: response.status,
      };
    }
  }

  getRequest(apiUrl: string): Observable<any> {
    return this.http
      .get(`${environment.proxy}${apiUrl}`, {
        observe: 'response',
        responseType: 'text', // Asegúrate de que el servidor envíe HTML como texto
        withCredentials: true,
      })
      .pipe(map(this.handleResponse.bind(this)));
  }

  postRequest(
    apiUrl: string,
    data: any,
    requiresAuth?: boolean
  ): Observable<any> {
    return this.http
      .post(`${environment.proxy}${apiUrl}`, data, {
        observe: 'response',
        responseType: 'text', // Asegúrate de que el servidor envíe HTML como texto
        withCredentials: true,
        headers: requiresAuth
          ? new HttpHeaders({
              Authorization: `Bearer ${
                localStorage.getItem('bearerToken') || ''
              }`,
            })
          : {},
      })
      .pipe(map(this.handleResponse.bind(this)));
  }
}

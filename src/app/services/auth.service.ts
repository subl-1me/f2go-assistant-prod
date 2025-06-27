import { Injectable } from '@angular/core';
import { environment } from '../../environment';
import { FrontService } from './front-service';
import Extractor from '../Extractor';
import Operator from '../models/operator';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private extractor: Extractor;
  constructor(private frontService: FrontService) {
    this.extractor = new Extractor();
  }

  public isAuthenticated(): boolean {
    const auth = localStorage.getItem('authorized');
    const hasBearar = localStorage.getItem('bearerToken');
    return auth && hasBearar ? true : false;
  }

  public async authenticate(operator: Operator): Promise<any> {
    const tokenResponse = await this.getRequestVerificationToken();
    const { status, verificationToken } = tokenResponse;
    if (!verificationToken || status !== 200) {
      return tokenResponse;
    }

    const formData = await this.composeLoginFormData(
      operator,
      verificationToken
    );
    const login = await this.auth(formData);
    localStorage.setItem('authorized', 'true');
    return login;
  }

  private async auth(formData: FormData): Promise<any> {
    return new Promise((resolve, reject) => {
      this.frontService
        .postRequest(environment.FRONT_API_LOGIN, formData)
        .subscribe({
          next: async (response) => {
            if (response.status !== 200) {
              resolve({
                status: response.status,
                message: response.rawData || response.data,
                error: true,
              });
            }

            // save bearer token
            this.saveBearerToken(response.rawData);

            // save mAutSession token
            // this.saveMAutSessionToken(response.cookies || '');
            // redirect to main page

            // set hdn property
            await this.setHdnProperty();

            resolve({
              status: response.status,
              erorr: false,
              message: 'Loged successfully.',
            });
          },
          error: (err) => reject(err),
        });
    });
  }

  private async getRequestVerificationToken(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.frontService
        .getRequest(environment.FRONT_API_LOGIN_GET_VERIFICATION_TOKEN)
        .subscribe({
          next: (response) => {
            if (response.status === 401) {
              resolve({
                status: response.status,
                error: true,
                message: 'Unauthorized. Please, log in again.',
              });
            }

            console.log(response);
            this.extractor = new Extractor(response.rawData);
            const verificationToken =
              this.extractor.extractRequestVerificationToken();

            // save verification token on localstorage
            // localStorage.setItem('verificationToken', verificationToken);
            // const cookies = response.cookies;
            // if (cookies) {
            //   // save antiforgery token optional
            //   this.saveAspNetCoreAntiforgeryToken(cookies);
            // }

            if (verificationToken === '' || !verificationToken) {
              resolve({
                status: response.status,
                error: true,
                message: 'Verification token not found.',
              });
            }

            resolve({
              status: response.status,
              verificationToken,
            });
          },
          error: (err) => reject(err),
        });
    });
  }

  private saveMAutSessionToken(cookie: string): void {
    const mAutSessionPattern = /mAutSession=[^;]+/g;
    const mAutSessionCookie = cookie.match(mAutSessionPattern);
    if (mAutSessionCookie) {
      localStorage.setItem(
        'mAutSessionToken',
        mAutSessionCookie[0].replace(';', '').trim()
      );
    } else {
      alert(
        'Authentication failed. Please, restart the application. \n\nError details: Authentication session token not found (L3).'
      );
    }
  }

  private saveAspNetToken(cookie: string): void {
    const aspNetTokenPattern = /\ASPXAUTH=[^;]*;/g;
    const aspNetAuthCookie = cookie.match(aspNetTokenPattern);
    if (aspNetAuthCookie) {
      const tokenSegments = aspNetAuthCookie[0].split('=');
      localStorage.setItem(
        'aspNetAuthToken',
        tokenSegments[1].replace(';', '').trim()
      );
    } else {
      alert(
        'Authentication failed. Please, restart the application. \n\nError details: ASP.NET authentication token not found (L4).'
      );
    }
  }

  private async setHdnProperty(): Promise<void> {
    const formData = await this.composeHdnPropertyFormData();
    this.frontService
      .postRequest(environment.FRONT_API_SET_HDN_PROPERTY, formData)
      .subscribe({
        next: (response) => {
          if (response.status !== 200) {
            alert('Failed to set HDN property: ' + response.rawData);
          }
          this.saveAspNetToken(response.cookies || '');
        },
        error: (error) => {
          console.error('Error setting HDN property:', error);
        },
      });
  }

  private saveBearerToken(rawData: string): void {
    const BearerVarDeclarationPattern = new RegExp(
      `let jsTques = "([\\s\\S\\t.]*?)"`
    );
    const match = rawData.match(BearerVarDeclarationPattern);
    if (match && match[1]) {
      const bearerToken = match[1].trim();
      localStorage.setItem('bearerToken', bearerToken);
    } else {
      alert(
        'Authentication failed. Please, restart the application. \n\nError details: Bearer token not found.'
      );
    }
  }

  private async composeLoginFormData(
    operator: Operator,
    verificationToken: string
  ): Promise<FormData> {
    return new Promise<FormData>((resolve, reject) => {
      let formData = new FormData();
      formData.append('Input.UseName', operator.username);
      formData.append('Input.Password', operator.password);
      formData.append('__RequestVerificationToken', verificationToken);
      formData.append('Input.RememberMe', 'false');
      resolve(formData);
    });
  }

  private async composeHdnPropertyFormData(): Promise<FormData> {
    let formData = new FormData();
    formData.append('_hdn001', environment.HDN_001 || '');
    formData.append('_hdn002', '');
    formData.append('_hdnPropName', environment.HDN_PROP_NAME || '');
    formData.append('_hdnRoleName', 'Recepcion');
    formData.append('_hdnOffset', '-6');
    formData.append('_hdnAppDate', '2025/06/19');
    formData.append('_hdnImgCookie	', 'none');
    formData.append(
      '__RequestVerificationToken',
      localStorage.getItem('verificationToken') || ''
    );
    return formData;
  }

  // optional
  // private saveAspNetCoreAntiforgeryToken(cookies: string | null): void {
  //   if (cookies) {
  //     const aspNetTokenPattern = /\.AspNetCore\.Antiforgery[^;]*;/g;
  //     const aspNetForgeryCookie = cookies.match(aspNetTokenPattern);
  //     if (aspNetForgeryCookie) {
  //       localStorage.setItem(
  //         'antiForgeryToken',
  //         aspNetForgeryCookie[0].replace(';', '').trim()
  //       );
  //     } else {
  //       this.isLoading = false;
  //       alert(
  //         'Authentication failed. Please, restart the application. \n\nError details: Antiforgery token not found (L2).'
  //       );
  //     }
  //   }
  // }
}

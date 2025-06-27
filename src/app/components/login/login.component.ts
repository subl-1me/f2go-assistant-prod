import { Component } from '@angular/core';
import Operator from '../../models/operator';
import { FormsModule, NgForm } from '@angular/forms';
import { environment } from '../../../environment';
import { FrontService } from '../../services/front-service';
import Extractor from '../../Extractor';
import { Observable, Subscribable, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  public operator: Operator;
  public isLoading: boolean = false;

  constructor(private frontService: FrontService, private router: Router) {
    this.operator = {
      username: '',
      password: '',
    };
  }

  public async onSubmit(form: NgForm): Promise<void> {
    if (form.invalid) {
      // TODO: Seng feedback

      return;
    }

    this.isLoading = true;
    // make request to f2go services
    // get req verification token
    const verificationToken = this.getRequestVerificationToken().subscribe({
      next: (verificationToken: string) => {
        // compose form data
        this.composeLoginFormData(this.operator, verificationToken).then(
          (formData: FormData) => {
            this.frontService
              .postRequest(environment.FRONT_API_LOGIN, formData)
              .subscribe((response) => {
                if (response.status !== 200) {
                  alert('Login failed:' + response.rawData);
                  return;
                }

                // save bearer token
                this.saveBearerToken(response.rawData);

                // save mAutSession token
                this.saveMAutSessionToken(response.cookies || '');
                // redirect to main page

                // set hdn property
                this.setHdnProperty().then(() => {
                  console.log('HDN property set successfully');
                });

                this.router.navigate(['']).then(() => {
                  // Optionally, you can reset the form after successful login
                  form.resetForm();
                  this.isLoading = false;
                  this.operator = {
                    username: '',
                    password: '',
                  };
                });
              });
          }
        );
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error fetching verification token:', err);
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
      this.isLoading = false;
      alert(
        'Authentication failed. Please, restart the application. \n\nError details: Bearer token not found.'
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
      this.isLoading = false;
      alert(
        'Authentication failed. Please, restart the application. \n\nError details: ASP.NET authentication token not found (L4).'
      );
    }
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
      this.isLoading = false;
      alert(
        'Authentication failed. Please, restart the application. \n\nError details: Authentication session token not found (L3).'
      );
    }
  }

  private getRequestVerificationToken(): Subscribable<string> {
    return new Observable<string>((observer) => {
      this.frontService
        .getRequest(environment.FRONT_API_LOGIN_GET_VERIFICATION_TOKEN)
        .subscribe((response) => {
          const extractor = new Extractor(response.rawData);
          const verificationToken = extractor.extractRequestVerificationToken();

          // save verification token on localstorage
          localStorage.setItem('verificationToken', verificationToken);
          const cookies = response.cookies;
          if (cookies) {
            // save antiforgery token
            this.saveAspNetCoreAntiforgeryToken(cookies);
          }

          if (verificationToken === '' || !verificationToken) {
            this.isLoading = false;
            alert(
              'Authentication failed. Please, restart the application. \n\nError details: Verification token not found (L1).'
            );
            observer.error('Verification token not found');
          } else {
            observer.next(verificationToken);
            observer.complete();
          }
        });
    });
  }

  private saveAspNetCoreAntiforgeryToken(cookies: string | null): void {
    if (cookies) {
      const aspNetTokenPattern = /\.AspNetCore\.Antiforgery[^;]*;/g;
      const aspNetForgeryCookie = cookies.match(aspNetTokenPattern);
      if (aspNetForgeryCookie) {
        localStorage.setItem(
          'antiForgeryToken',
          aspNetForgeryCookie[0].replace(';', '').trim()
        );
      } else {
        this.isLoading = false;
        alert(
          'Authentication failed. Please, restart the application. \n\nError details: Antiforgery token not found (L2).'
        );
      }
    }
  }

  private async composeLoginFormData(
    operator: Operator,
    verificationToken: string
  ): Promise<FormData> {
    let formData = new FormData();
    formData.append('Input.UseName', operator.username);
    formData.append('Input.Password', operator.password);
    formData.append('__RequestVerificationToken', verificationToken);
    formData.append('Input.RememberMe', 'false');
    return formData;
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
}

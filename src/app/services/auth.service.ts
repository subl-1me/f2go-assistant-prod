import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}

  public isAuthenticated(): boolean {
    const mAutSessionToken = localStorage.getItem('mAutSessionToken');
    const aspAntiForgeryToken = localStorage.getItem('antiForgeryToken');
    const verificationToken = localStorage.getItem('verificationToken');
    return mAutSessionToken && aspAntiForgeryToken && verificationToken
      ? true
      : false;
  }
}

import { Component } from '@angular/core';
import Operator from '../../models/operator';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../services/auth.service';

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

  constructor(private authService: AuthService, private router: Router) {
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
    const authentication = await this.authService.authenticate(this.operator);
    console.log(authentication);
    this.isLoading = false;
  }
}

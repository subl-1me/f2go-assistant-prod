import { Component } from '@angular/core';
import Operator from '../../types/operator';
import { FormsModule, NgForm } from '@angular/forms';
import { environment } from '../../../environment';
import { FrontService } from '../../services/front-service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  public operator: Operator;

  constructor(private frontService: FrontService) {
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

    // make request to f2go services
    const verificationToken = await this.getRequestVerificationToken();

    // get req verification token

    // compose payload
    const formData = this.composeLoginFormData(this.operator, '');
  }

  private async getRequestVerificationToken(): Promise<string> {
    this.frontService
      .getRequest(environment.FRONT_API_LOGIN)
      .subscribe((response: string) => {
        console.log(response);
      });
    return '';
  }

  private composeLoginFormData(
    operator: Operator,
    verificationToken: string
  ): FormData {
    let formData = new FormData();
    formData.append('Input.UseName', operator.username);
    formData.append('Input.Password', operator.password);
    formData.append('__RequestVerificationToken', verificationToken);
    formData.append('Input.RememberMe', 'false');
    return formData;
  }
}

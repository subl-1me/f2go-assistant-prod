import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  constructor(private router: Router) {}

  public logOut() {
    localStorage.removeItem('bearerToken');
    localStorage.removeItem('antiForgeryToken');
    localStorage.removeItem('aspNetAuthToken');
    localStorage.removeItem('mAutSessionToken');
    localStorage.removeItem('verificationToken');
    this.router.navigate(['/login']);
  }
}

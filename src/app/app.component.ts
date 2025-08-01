import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { AuthService } from './services/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'f2go-assistant';
  public isAuth: boolean;

  constructor(private authService: AuthService) {
    this.isAuth = this.authService.isAuthenticated();
  }

  ngOnInit(): void {
    this.authService.isAuthenticated$.subscribe((auth) => {
      this.isAuth = auth;
    });
  }
}

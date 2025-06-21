import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import BackgroundProcess from '../../models/BackgroundProcess';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  constructor(private router: Router) {
    setInterval(() => {
      this.updateProcesses();
    }, 2000);
  }

  backgroundProcesses: BackgroundProcess[] = [];

  updateProcesses() {
    this.backgroundProcesses = this.backgroundProcesses.map((process) => {
      if (process.progress < 100) {
        const increment = Math.floor(Math.random() * 10) + 1;
        const newProgress = Math.min(process.progress + increment, 100);
        const newEstimatedTime = Math.max(
          process.estimatedTime - Math.floor(Math.random() * 5),
          0
        );

        let newStatus = process.status;
        if (newProgress >= 100) {
          newStatus = 'Completado';
        } else if (newProgress > 80) {
          newStatus = 'Finalizando...';
        }

        return {
          ...process,
          progress: newProgress,
          estimatedTime: newEstimatedTime,
          status: newStatus,
        };
      }
      return process;
    });

    // Eliminar procesos completados después de 5 segundos
    // this.backgroundProcesses = this.backgroundProcesses.filter(
    //   (p) => p.progress < 100 || Date.now() - p.completedTime < 5000
    // );
  }

  public logOut() {
    localStorage.removeItem('bearerToken');
    localStorage.removeItem('antiForgeryToken');
    localStorage.removeItem('aspNetAuthToken');
    localStorage.removeItem('mAutSessionToken');
    localStorage.removeItem('verificationToken');
    this.router.navigate(['/login']);
  }
}

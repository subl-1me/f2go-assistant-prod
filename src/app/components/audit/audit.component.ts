import { Component } from '@angular/core';
import { FrontService } from '../../services/front-service';
import { environment } from '../../../environment';

@Component({
  selector: 'app-audit',
  imports: [],
  templateUrl: './audit.component.html',
  styleUrl: './audit.component.css',
})
export class AuditComponent {
  constructor(private frontService: FrontService) {}

  public onStartAuditReports() {
    // get last generated audit report list
    this.frontService
      .postRequest(
        environment.FRONT_API_GET_AUDIT_REPORT_LIST,
        { PropCode: environment.HDN_001 },
        true
      )
      .subscribe({
        next: (response) => {
          const { data } = response;
          const lastReportIndex = data.length - 5;
          const lastReports = data[lastReportIndex];

          console.log('Last generated audit reports:', lastReports);
        },
        error: (error) => {
          console.error('Error fetching audit report list:', error);
        },
      });
  }
}

import { Component, OnInit } from '@angular/core';
import { LocalDatabaseService } from '../../services/local-database.service';
import StandardCheckResult from '../../models/StandardCheckResult';
import { NgFor, NgIf } from '@angular/common';
import { TodayDeparturesComponent } from './today-departures/today-departures.component';

@Component({
  selector: 'app-invoices',
  imports: [TodayDeparturesComponent, NgIf],
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.css',
})
export class InvoicesComponent implements OnInit {
  public cache: StandardCheckResult[];
  public isCurrentCardCollapsed: boolean;

  constructor(private localDBService: LocalDatabaseService) {
    this.cache = [];
    this.isCurrentCardCollapsed = false;
  }

  ngOnInit(): void {}

  public toggleCurrentCardCollapse(): void {
    this.isCurrentCardCollapsed = !this.isCurrentCardCollapsed;
  }
}

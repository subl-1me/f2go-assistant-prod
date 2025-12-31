import { TestBed } from '@angular/core/testing';

import { InvoicerService } from './invoicer.service';

describe('InvoicerService', () => {
  let service: InvoicerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InvoicerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { LedgerService } from './ledger.service';

describe('LedgerService', () => {
  let service: LedgerService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpTestingController] });
    service = TestBed.inject(LedgerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

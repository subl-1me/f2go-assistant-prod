import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { PrepaidService } from './prepaid.service';

describe('PrepaidService', () => {
  let service: PrepaidService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrepaidService);
  });

  it('Should get reservation coupons', () => {
    expect(service).toBeTruthy();
  });
});

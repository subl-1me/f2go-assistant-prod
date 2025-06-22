import { TestBed } from '@angular/core/testing';

import { PrepaidService } from './prepaid.service';

describe('PrepaidService', () => {
  let service: PrepaidService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PrepaidService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

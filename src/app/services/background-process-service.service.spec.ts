import { TestBed } from '@angular/core/testing';

import { BackgroundProcessServiceService } from './background-process-service.service';

describe('BackgroundProcessServiceService', () => {
  let service: BackgroundProcessServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BackgroundProcessServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

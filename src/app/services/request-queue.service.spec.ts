import { TestBed } from '@angular/core/testing';

import { RequestQueueService } from './request-queue.service';

describe('RequestQueueService', () => {
  let service: RequestQueueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RequestQueueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

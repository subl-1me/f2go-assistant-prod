import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { CheckerService } from './checker.service';

describe('CheckerService', () => {
  let service: CheckerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpTestingController],
    });
    service = TestBed.inject(CheckerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { DocumentAnalyzerService } from './document-analyzer.service';

describe('DocumentAnalyzerService', () => {
  let service: DocumentAnalyzerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentAnalyzerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { DocumentAnalyzerService } from './document-analyzer.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { saveTestResults } from '../utils/test-utils';
import { environment } from '../../environment';
import { lastValueFrom } from 'rxjs';

describe('DocumentAnalyzerService', () => {
  let service: DocumentAnalyzerService;
  let httpTestingController: HttpTestingController;

  // Mock data
  const mockFiles = [
    '24765345-document-175627682490448a2911f-4dde-4524-a90d-4e124784db5a.pdf',
    '24765345-document-175627682648072329f09-4c03-4616-8731-42d0ca4c9851.pdf',
    '24798251-document-1756452278172f6b0f992-8704-4098-ad81-824a4fed0ae2.pdf',
    '24798276-document-17564522644406dc56ab6-fce5-4cb2-8945-b7cf56ded2e6.pdf',
    '24811054-document-1756276828674e7203fc9-160b-4b04-aa16-1e6fd436e1d8.pdf',
    '24831769-document-17564522594334c0b589e-8ddd-4704-9fcb-a86308b258ea.pdf',
    '24831769-document-1756536165526f5530bbf-41c2-4986-b49f-521cd3f8cecf.pdf',
    '24835260-document-1756196374158630da83a-2e21-4813-b832-32e7c4f626f1.pdf',
    '24835260-document-17561971875777af431e7-15c3-4c52-8e49-52235ae83e36.pdf',
    '24835260-document-17562768200802b7dc885-869c-4106-aca9-e6a8c931bf23.pdf',
    '24835260-document-175645229014800fcfd28-517b-443a-bb91-994dd7565a34.pdf',
    '24861838-document-1756196371317602af58f-73bd-44a5-acf1-668e862d0826.pdf',
    '24861838-document-17561971858706fd72635-1622-46f9-9d28-fb11ba0f9ffd.pdf',
    '24861838-document-1756276818638c3d19f2b-7a09-4fe2-b3bb-4f8d01e176e2.pdf',
    '24864090-document-175627680151710d0a797-2718-4be1-a779-efd0cadc4769.pdf',
    '24864732-document-1756196379301c4e2be50-0028-47af-a583-76360a71682a.pdf',
    '24864732-document-175619719033911de292d-a01c-48ea-9fff-b9d0e82da72c.pdf',
    '24869844-document-175653616867829bd9fff-cf6f-4c6d-9194-7cb5221744a0.pdf',
    '24872263-document-1756196349643a4bbeab4-41fc-4d9d-ab67-ed58e9e4e896.pdf',
    '24872263-document-17561971657812fa2ecd5-fe70-45fb-a59c-e4fc69cd8625.pdf',
    '24872263-document-175627680326637e78e00-b482-4261-bfcb-3b05e291e764.pdf',
    '24877943-document-17561958278861b83242e-e7e1-417e-9f33-5a2c5b8d969a.pdf',
    '24877943-document-1756196368563429862b1-90ed-489b-9b2c-e8de3c84ec14.pdf',
    '24877943-document-17561971842620887bba2-91d5-4a1d-a5d3-fe4d76d75dfc.pdf',
    '24877943-document-175627681703727b244c4-d045-40f7-98e6-c060dd11b54e.pdf',
    '24877943-document-1756452287892b8c4fe70-b956-4a2f-b28a-8f8682dd37ec.pdf',
    '24877943-document-1756536182393c2a13732-3e7d-4ec1-9f57-6a7bdafd2daa.pdf',
    '24892622-document-1756452280412827e219b-9d45-42c3-b89e-f925ca9f6125.pdf',
    '24892622-document-175645228191452dd5c9c-88d3-4746-a170-1cd5cbe82f36.pdf',
    '24893183-document-17561963527152a1e70e5-c1fe-4386-92ce-4fd89a41e9b4.pdf',
    '24893183-document-175619717039222e27967-ce87-4854-8010-66e40337d4d0.pdf',
    '24893895-document-1756276804920350b667e-e57f-46aa-9798-2376fa4881c2.pdf',
    '24894341-document-17561963512970c59967e-d8fb-468a-848f-ec0182a99265.pdf',
    '24894341-document-17561971681771972d335-a8e6-4633-8229-c37b66d26c8b.pdf',
    '24894467-document-1756196355884410f8114-8e63-444d-bb8b-1c9d7a7a441f.pdf',
    '24894467-document-175619635795806409b72-8820-4d6a-8f6c-04e4ec1124dd.pdf',
    '24894467-document-175619717332858c0d7b2-541c-45e4-af5d-2ff363f63cc4.pdf',
    '24894467-document-1756197175828ad2a2215-e6fd-4bec-84bd-cdeedcb1faf2.pdf',
    '24894467-document-1756276806741180625cf-cc12-4311-902e-a65a171c02f9.pdf',
    '24894467-document-17562768098739025c717-9ab8-4bb3-a4ee-651263ee3a38.pdf',
    '24894467-document-175645227244037140b16-6c29-441c-8c27-dbbec4818297.pdf',
    '24894467-document-1756452274595d5459714-ad29-4312-9b84-8dc191418f24.pdf',
    '24894467-document-17565361751165051e1b5-c47a-4bd6-8e2f-6a98be1dbace.pdf',
    '24894467-document-17565361775138767934e-4f32-4141-a00c-a48794e9e02a.pdf',
    '24894767-document-175627682270866e8b0ca-a179-45df-80a9-e4a0c79f6539.pdf',
    '24894767-document-1756452293780b97e0cee-5b60-4692-85b3-13b587e8d0e1.pdf',
    '24896559-document-17561963814278b6db024-1036-4522-9820-7fefe2dd0ff0.pdf',
    '24896559-document-1756196383569b4d7574c-c407-4b4b-8a86-4ffe39430c97.pdf',
    '24896559-document-1756197191996f7799330-3c3d-430c-a038-9c745f5348f6.pdf',
    '24896559-document-175619719388465fb6a88-578b-4a69-90da-cc7ac933578d.pdf',
    '24898456-document-17561963610817820d8d5-e227-40c5-92d3-eddfe2cddb4d.pdf',
    '24898456-document-17561963633121b9105fb-1d4b-4137-ad2a-d4821d63d5c0.pdf',
    '24898456-document-1756196365223bdf71628-9fd0-4dfa-a97b-fc5830771a7d.pdf',
    '24898456-document-17561971787498e2402a0-ae8e-48fd-9fea-25d5de558729.pdf',
    '24898456-document-1756197180554355aec33-24f0-4b14-ada3-7b423fd9055b.pdf',
    '24898456-document-17561971824739bcbb63e-8095-478e-886e-97b07e7d025e.pdf',
    '24898456-document-1756276812436b0a7a07d-ce76-4f8b-9d9f-4b5ed9243212.pdf',
    '24898456-document-17562768139105562845d-6719-4d33-8b68-5e4b279ce19f.pdf',
    '24898456-document-17562768154777770848d-ee89-41d0-9ca0-fef65b3cc38a.pdf',
    '24898456-document-17564522835497ce4d17b-8c88-44c3-b1d9-115378fe9891.pdf',
    '24898456-document-175645228488090dfaa39-1b4a-4758-b3f2-51249d137888.pdf',
    '24898456-document-17564522864905299de44-f8e9-43e6-9c16-ed303dc7eea3.pdf',
    '24900101-document-17564522612130a824c1b-f929-4b47-b3da-a875e016c899.pdf',
    '24900101-document-17564522630176f9d5847-2969-4f62-a71e-58b165cee69e.pdf',
    '24904227-document-1756452267025fb1b947c-ade8-4248-8168-33a1ea3ee260.pdf',
    '24904227-document-1756536170681bb33a7b2-7c81-447d-9b49-6149e7e43f6b.pdf',
    '24904263-document-1756452295868c69ff017-9e44-4f77-bb43-da0ac665b4f1.pdf',
    '24904263-document-175653618396963b23417-76dd-4367-9347-c18e13b872f8.pdf',
    '24910222-document-175645227088730633ca4-994b-4d8b-afb8-31a54caad151.pdf',
    '24911501-document-1756452254811ec7bdde3-9655-4a13-9892-9c931c5ac711.pdf',
  ];
  const mockExtractions = Array.from({ length: mockFiles.length }, () => '');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DocumentAnalyzerService,
        provideHttpClient(withInterceptorsFromDi()),
      ],
    });
    service = TestBed.inject(DocumentAnalyzerService);
  });
  // it('should be created', () => {
  //   expect(service).toBeTruthy();
  // });

  it('should extract & analyze each downloaded document', async () => {
    // Simular la lista de archivos
    const mockFilePaths = mockFiles.map(
      (file) => `temp/downloaded-documents/${file}`
    );

    const results = await Promise.allSettled(
      mockFilePaths.map(async (filePath) => {
        console.log('Calling proxy with:', filePath);
        const startTime = Date.now();

        try {
          const result = await await service.analyze(filePath);
          const duration = Date.now() - startTime;
          // Assert type to avoid 'unknown' error
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          throw error;
        }
      })
    );

    saveTestResults('extractions-output.json', results);

    // Verify results
    expect(results).toBeDefined();
  });
});

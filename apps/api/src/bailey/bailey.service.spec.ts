import { Test, TestingModule } from '@nestjs/testing';
import { BaileyService } from './bailey.service.js';

describe('BaileyService', () => {
  let service: BaileyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BaileyService],
    }).compile();

    service = module.get<BaileyService>(BaileyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

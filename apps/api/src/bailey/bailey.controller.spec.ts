import { Test, TestingModule } from '@nestjs/testing';
import { BaileyController } from './bailey.controller.js';

describe('BaileyController', () => {
  let controller: BaileyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BaileyController],
    }).compile();

    controller = module.get<BaileyController>(BaileyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

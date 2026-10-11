import { Test, TestingModule } from '@nestjs/testing';
import { HotelService } from './hotel.service.js';
import { DRIZZLE } from '../database/database.module.js';

describe('HotelService', () => {
  let service: HotelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelService,
        { provide: DRIZZLE, useValue: {} },
      ],
    }).compile();

    service = module.get<HotelService>(HotelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

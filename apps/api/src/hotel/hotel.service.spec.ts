import { Test, TestingModule } from '@nestjs/testing';
import { HotelService } from './hotel.service.js';
import { KafkaService } from '../kafka/kafka.service.js';
import { BaileysService } from '../bailey/bailey.service.js';
import { DRIZZLE } from '../database/database.module.js';

describe('HotelService', () => {
  let service: HotelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelService,
        { provide: DRIZZLE, useValue: {} },
        { provide: KafkaService, useValue: { sendMessage: vi.fn() } },
        { provide: BaileysService, useValue: { sendToReceiver: vi.fn().mockResolvedValue(true) } },
      ],
    }).compile();

    service = module.get<HotelService>(HotelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

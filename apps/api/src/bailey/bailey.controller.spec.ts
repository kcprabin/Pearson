import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappController } from './bailey.controller.js';
import { BaileysService } from './bailey.service.js';

describe('WhatsappController', () => {
  let controller: WhatsappController;
  const baileysService = {
    initializePairing: vi.fn(),
    sendTextMessage: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsappController],
      providers: [{ provide: BaileysService, useValue: baileysService }],
    }).compile();

    controller = module.get<WhatsappController>(WhatsappController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns the pairing code from the service', async () => {
    baileysService.initializePairing.mockResolvedValue({ pairingCode: 'ABCD-1234' });

    await expect(controller.initializeWhatsApp('+1 (555) 123-4567')).resolves.toEqual({
      message: 'Pairing code generated successfully. Enter this code in WhatsApp under Linked Devices.',
      code: 'ABCD-1234',
    });
    expect(baileysService.initializePairing).toHaveBeenCalledWith('+1 (555) 123-4567');
  });

  it('propagates pairing errors', async () => {
    const error = new Error('WhatsApp connection is not established.');
    baileysService.initializePairing.mockRejectedValue(error);

    await expect(controller.initializeWhatsApp('15551234567')).rejects.toThrow(error);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { BaileysService } from './bailey.service.js';

describe('BaileysService', () => {
  let service: BaileysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BaileysService],
    }).compile();

    service = module.get<BaileysService>(BaileysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects pairing when WhatsApp is not connected', async () => {
    await expect(service.initializePairing('15551234567')).rejects.toThrow(
      'WhatsApp is still reconnecting. Pairing was not completed; try again in a moment.',
    );
  }, 15000);

  it('requests a pairing code with a normalized phone number', async () => {
    const requestPairingCode = vi.fn().mockResolvedValue('ABCD-1234');
    (service as any).sock = { requestPairingCode };
    (service as any).connectionState = 'connecting';

    await expect(service.initializePairing('+1 (555) 123-4567')).resolves.toEqual({
      pairingCode: 'ABCD-1234',
    });
    expect(requestPairingCode).toHaveBeenCalledWith('15551234567');
  });

  it('returns a retryable error when the socket closes during pairing', async () => {
    const requestPairingCode = vi.fn().mockRejectedValue(new Error('Connection Closed'));
    (service as any).sock = { requestPairingCode };
    (service as any).connectionState = 'connecting';

    await expect(service.initializePairing('15551234567')).rejects.toThrow(
      'WhatsApp is still reconnecting. Pairing was not completed; try again in a moment.',
    );
  }, 15000);
});

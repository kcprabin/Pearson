import {
  Injectable,
  OnModuleInit,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import pino from 'pino';

@Injectable()
export class BaileysService implements OnModuleInit {
  private readonly logger = new Logger(BaileysService.name);
  private sock?: WASocket;
  private connectionState: 'connecting' | 'open' | 'closed' = 'closed';
  private pairingReady = false;
  private latestQr?: string;
   
    onModuleInit() {
      this.connectToWhatsApp().catch((error) => {
        this.logger.error('WhatsApp connection setup failed.', error);
        this.connectionState = 'closed';
      });
  }

    async connectToWhatsApp() {
    // Saves auth credentials locally so you ONLY pair once!
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state,
    });
    this.sock = socket;
    this.connectionState = 'connecting';
    this.pairingReady = false;
    this.latestQr = undefined;

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr && !socket.authState.creds.registered) {
        this.pairingReady = true;
        this.latestQr = qr;
      }

      if (connection === 'close') {
        this.connectionState = 'closed';
        this.pairingReady = false;
        this.latestQr = undefined;
        const disconnectError = lastDisconnect?.error as any;
        const statusCode = disconnectError?.output?.statusCode;
        this.logger.warn(
          `WhatsApp connection closed${statusCode ? ` (${statusCode})` : ''}: ${disconnectError?.message ?? 'unknown reason'}`,
        );
        if (this.sock === socket) {
          this.sock = undefined;
        }
        const shouldReconnect =
          statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          this.connectToWhatsApp().catch((error) => {
            this.logger.error('WhatsApp reconnect failed.', error);
          });
        }
      } else if (connection === 'open') {
        this.connectionState = 'open';
        this.pairingReady = false;
        this.latestQr = undefined;
        this.logger.log(' Connected to WhatsApp! PEARSON is live.');
      }
    });
  }
    
   async initializePairing(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const socket = this.sock;
      if (socket && this.pairingReady) {
        try {
          const code = await socket.requestPairingCode(cleanPhone);
          return { pairingCode: code };
        } catch (error) {
          if (!(error instanceof Error) || error.message !== 'Connection Closed') {
            throw error;
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    throw new ServiceUnavailableException(
      'WhatsApp is not ready for pairing yet. Wait for the connection to initialize and try again.',
    );
  }

  getStatus() {
    return {
      connection: this.connectionState,
      pairingReady: this.pairingReady,
      registered: this.sock?.authState.creds.registered ?? false,
    };
  }

  getQr() {
    if (!this.latestQr) {
      throw new ServiceUnavailableException(
        'A QR code is not available yet. Wait for WhatsApp to initialize and try again.',
      );
    }

    return { qr: this.latestQr };
  }

   async sendTextMessage(phone: string, message: string) {
    if (!this.sock || this.connectionState === 'closed') {
      throw new Error('WhatsApp connection is not established.');
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const jid = `${
      cleanPhone.length === 10 ? cleanPhone + '@s.whatsapp.net' : cleanPhone + '@c.us'
    }`;

    await this.sock.sendMessage(jid, { text: message });
  }
}
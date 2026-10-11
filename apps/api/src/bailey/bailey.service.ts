import {
  Injectable,
  OnModuleInit,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { rm } from 'node:fs/promises';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

@Injectable()
export class BaileysService implements OnModuleInit {
  private readonly logger = new Logger(BaileysService.name);
  private readonly menuRequestMessage =
    'Hi! I am your AI agent. Please send me your menu so I can store your menu data and help you take orders.';
  private sock?: WASocket;
  private connectionState: 'connecting' | 'open' | 'closed' = 'closed';
  private pairingReady = false;
  private isPairing = false;
  private pairingRequest?: Promise<string>;
  private latestQr?: string;
   
    onModuleInit() {
      this.connectToWhatsApp().catch((error) => {
        this.logger.error('WhatsApp connection setup failed.', error);
        this.connectionState = 'closed';
      });
  }

    async connectToWhatsApp() {
    // Saves auth credentials locally so you ONLY pair once!
    const authPath = './auth_info_baileys';
    let authState = await useMultiFileAuthState(authPath);
    if (!authState.state.creds.registered && authState.state.creds.pairingCode) {
      this.logger.warn('Discarding an incomplete WhatsApp pairing session.');
      await rm(authPath, { recursive: true, force: true });
      authState = await useMultiFileAuthState(authPath);
    }
    const { state, saveCreds } = authState;
    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state,
      browser: ['Mac OS', 'Brave', '1.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
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
        qrcode.generate(qr, { small: true });
        this.logger.log('Scan the QR code above from WhatsApp > Linked devices.');
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
        const incompletePairing = !socket.authState.creds.registered;
        const shouldReconnect =
          statusCode !== DisconnectReason.loggedOut || incompletePairing;
        if (statusCode === DisconnectReason.loggedOut && incompletePairing) {
          await rm('./auth_info_baileys', { recursive: true, force: true });
        }
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
        const accountJid = jidNormalizedUser(socket.user?.id);
        await socket.sendMessage(accountJid, {
          text: this.menuRequestMessage,
        });
        this.logger.log(`Sent the menu request message to ${accountJid}.`);
      }
    });
  }

  private requestPairingCodeAfterDelay(
    socket: WASocket,
    cleanPhone: string,
  ): Promise<string> {
    if (this.pairingRequest) {
      return this.pairingRequest;
    }

    this.isPairing = true;
    const request = (async () => {
      if (socket.authState) {
        await new Promise((resolve) => setTimeout(resolve, 6000));
      }
      if (this.sock !== socket || socket.authState.creds.registered) {
        throw new Error('Connection Closed');
      }
      return this.sock.requestPairingCode(cleanPhone);
    })();

    this.pairingRequest = request.finally(() => {
      this.isPairing = false;
      this.pairingRequest = undefined;
    });
    return this.pairingRequest;
  }
    
   async initializePairing(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const socket = this.sock;
      const registered = socket?.authState?.creds?.registered ?? false;
      if (socket && !registered) {
        try {
          const code = await this.requestPairingCodeAfterDelay(socket, cleanPhone);
          return { pairingCode: code };
        } catch (error) {
          if (
            !(error instanceof Error) ||
            !error.message.toLowerCase().includes('connection closed')
          ) {
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
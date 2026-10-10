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
   
    onModuleInit() {
    this.connectToWhatsApp();
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

    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Trigger pairing code if not registered yet
      if (qr && !socket.authState.creds.registered) {
        const ownerPhone = process.env.OWNER_WHATSAPP_NUMBER; 
        
        if (ownerPhone) {
          const cleanPhone = ownerPhone.replace(/\D/g, '');
          const code = await socket.requestPairingCode(cleanPhone);
          
          this.logger.log(`\n========================================`);
          this.logger.log(` YOUR WHATSAPP PAIRING CODE: ${code}`);
          this.logger.log(`========================================\n`);
        }
      }

      if (connection === 'close') {
        this.connectionState = 'closed';
        if (this.sock === socket) {
          this.sock = undefined;
        }
        const shouldReconnect =
          (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) this.connectToWhatsApp();
      } else if (connection === 'open') {
        this.connectionState = 'open';
        this.logger.log(' Connected to WhatsApp! PEARSON is live.');
      }
    });
  }
    
   async initializePairing(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '');
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const socket = this.sock;
      if (socket && this.connectionState !== 'closed') {
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
      'WhatsApp is still reconnecting. Pairing was not completed; try again in a moment.',
    );
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
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
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
  private sock: WASocket;

  async onModuleInit() {
    await this.connectToWhatsApp();
  }

  private async connectToWhatsApp() {
    // Saves auth credentials locally so you ONLY pair once!
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys');
    const { version } = await fetchLatestBaileysVersion();

    this.sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state,
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Trigger pairing code if not registered yet
      if (qr && !this.sock.authState.creds.registered) {
        const ownerPhone = process.env.OWNER_WHATSAPP_NUMBER; 
        
        if (ownerPhone) {
          const cleanPhone = ownerPhone.replace(/\D/g, '');
          const code = await this.sock.requestPairingCode(cleanPhone);
          
          this.logger.log(`\n========================================`);
          this.logger.log(` YOUR WHATSAPP PAIRING CODE: ${code}`);
          this.logger.log(`========================================\n`);
        }
      }

      if (connection === 'close') {
        const shouldReconnect =
          (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) this.connectToWhatsApp();
      } else if (connection === 'open') {
        this.logger.log(' Connected to WhatsApp! PEARSON is live.');
      }
    });
  }

  async sendTextMessage(phone: string, message: string) {
    if (!this.sock) {
      throw new Error('WhatsApp connection is not established.');
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const jid = `${
      cleanPhone.length === 10 ? cleanPhone + '@s.whatsapp.net' : cleanPhone + '@c.us'
    }`;

    await this.sock.sendMessage(jid, { text: message });
  }
}
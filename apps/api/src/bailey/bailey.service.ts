import {
  Injectable,
  Inject,
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
import { schema } from '@Pearson/database';
import { DRIZZLE } from '../database/database.module.js';
import { KafkaService } from '../kafka/kafka.service.js';

type WhatsAppRole = 'receiver' | 'bot';
type ConnectionState = 'connecting' | 'open' | 'closed';
const { incomingMessagesTable } = schema;

@Injectable()
export class BaileysService implements OnModuleInit {
  private readonly logger = new Logger(BaileysService.name);
  private readonly restaurantInfoRequestMessage =
    'Hi! I am Pearson, your AI restaurant assistant. Before we add your menu, please send your restaurant details in this format:\n\nRestaurant name: Sunrise Cafe\nAddress: 123 Main Street, Kathmandu\nRestaurant phone number: 9800000000\nRestaurant email: hello@sunrisecafe.com\nOwner name: Ram Sharma\nOwner email: ram@sunrisecafe.com\nOwner phone number: 9811111111\n\nThis is demo data. Please replace it with your real restaurant details. After saving these details, I will ask you for your menu and help you manage orders.';
  private readonly sockets = new Map<WhatsAppRole, WASocket>();
  private readonly connectionStates = new Map<WhatsAppRole, ConnectionState>();
  private readonly pairingReady = new Map<WhatsAppRole, boolean>();
  private readonly latestQrs = new Map<WhatsAppRole, string>();
  private isPairing = false;
  private pairingRequest?: Promise<string>;

  constructor(
    @Inject(DRIZZLE) private readonly database: any,
    private readonly kafkaService: KafkaService,
  ) {}

  onModuleInit() {
    this.connectToWhatsApp('receiver').catch((error) => {
      this.logger.error('Receiver WhatsApp connection setup failed.', error);
    });
  }

  private async connectToWhatsApp(role: WhatsAppRole) {
    const authPath = `./auth_info_baileys_${role}`;
    this.logger.log(`[${role}] Starting WhatsApp session with auth path ${authPath}.`);
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
    this.sockets.set(role, socket);
    this.connectionStates.set(role, 'connecting');
    this.pairingReady.set(role, false);
    this.latestQrs.delete(role);
    this.logger.log(
      `[${role}] Socket created. Registered: ${state.creds.registered}. Waiting for QR or connection.`,
    );

    socket.ev.on('creds.update', saveCreds);

    if (role === 'bot') {
      socket.ev.on('messages.upsert', async ({ messages, type }) => {
        for (const message of messages) {
          const text =
            message.message?.conversation ??
            message.message?.extendedTextMessage?.text ??
            message.message?.imageMessage?.caption ??
            message.message?.videoMessage?.caption;
          const sender = message.key.participant ?? message.key.remoteJid ?? 'unknown';
          const chat = message.key.remoteJid ?? 'unknown';

          this.logger.log(
            `[bot] Incoming WhatsApp message (${type}) from ${sender} in ${chat}: ${text ?? '[non-text message]'}`,
          );

          if (!message.key.id || !text || message.key.fromMe) {
            continue;
          }

          try {
            const [savedMessage] = await this.database
              .insert(incomingMessagesTable)
              .values({
                messageId: message.key.id,
                senderJid: sender,
                chatJid: chat,
                text,
              })
              .onConflictDoNothing({ target: incomingMessagesTable.messageId })
              .returning();

            if (savedMessage) {
              await this.kafkaService.publishIncomingMessage(savedMessage);
              this.logger.log(`[bot] Saved and published message ${savedMessage.messageId}.`);
            }
          } catch (error) {
            this.logger.error(
              `[bot] Failed to save or publish message ${message.key.id}.`,
              error instanceof Error ? error.stack : String(error),
            );
          }
        }
      });
      this.logger.log('[bot] Incoming message listener is active.');
    }

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      this.logger.log(
        `[${role}] Connection update: ${connection ?? 'pending'}; QR: ${qr ? 'received' : 'not received'}; registered: ${socket.authState.creds.registered}.`,
      );

      if (qr && !socket.authState.creds.registered) {
        this.pairingReady.set(role, true);
        this.latestQrs.set(role, qr);
        qrcode.generate(qr, { small: true });
        this.logger.log(
          `[${role}] QR ready. Scan it from WhatsApp > Linked devices.`,
        );
      }

      if (connection === 'close') {
        this.connectionStates.set(role, 'closed');
        this.pairingReady.set(role, false);
        this.latestQrs.delete(role);
        const disconnectError = lastDisconnect?.error as any;
        const statusCode = disconnectError?.output?.statusCode;
        this.logger.warn(
          `[${role}] WhatsApp connection closed${statusCode ? ` (${statusCode})` : ''}: ${disconnectError?.message ?? 'unknown reason'}`,
        );
        if (this.sockets.get(role) === socket) {
          this.sockets.delete(role);
        }
        const incompletePairing = !socket.authState.creds.registered;
        const shouldReconnect =
          statusCode !== DisconnectReason.loggedOut || incompletePairing;
        if (statusCode === DisconnectReason.loggedOut && incompletePairing) {
          await rm(authPath, { recursive: true, force: true });
        }
        if (shouldReconnect) {
          this.logger.log(`[${role}] Reconnecting this WhatsApp session.`);
          this.connectToWhatsApp(role).catch((error) => {
            this.logger.error(`${role} WhatsApp reconnect failed.`, error);
          });
        }
      } else if (connection === 'open') {
        this.connectionStates.set(role, 'open');
        this.pairingReady.set(role, false);
        this.latestQrs.delete(role);
        this.logger.log(`Connected to WhatsApp as ${role}.`);

        if (role === 'receiver') {
          this.logger.log(
            '[receiver] Receiver login complete. Starting the bot WhatsApp session now.',
          );
          this.connectToWhatsApp('bot').catch((error) => {
            this.logger.error('Bot WhatsApp connection setup failed.', error);
          });
        } else {
          try {
            await this.sendMenuRequest();
            this.logger.log(
              '[bot] Both WhatsApp accounts are logged in and the menu message was sent. PEARSON is live.',
            );
          } catch (error) {
            this.logger.error(
              '[bot] Login completed, but the menu message could not be sent.',
              error instanceof Error ? error.stack : String(error),
            );
          }
        }
      }
    });
  }

  private async sendMenuRequest() {
    const receiver = this.sockets.get('receiver');
    const bot = this.sockets.get('bot');
    const receiverJid = jidNormalizedUser(receiver?.user?.id);

    if (!receiver || !bot || !receiverJid) {
      throw new Error(
        `Missing connected account identity. receiver=${Boolean(receiver)} bot=${Boolean(bot)} receiverJid=${Boolean(receiverJid)}`,
      );
    }

    await bot.sendMessage(receiverJid, {
      text: this.restaurantInfoRequestMessage,
    });
    this.logger.log(`Bot sent the menu request message to ${receiverJid}.`);
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
      if (this.sockets.get('bot') !== socket || socket.authState.creds.registered) {
        throw new Error('Connection Closed');
      }
      return socket.requestPairingCode(cleanPhone);
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
      const socket = this.sockets.get('bot');
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
      receiver: this.getRoleStatus('receiver'),
      bot: this.getRoleStatus('bot'),
    };
  }

  private getRoleStatus(role: WhatsAppRole) {
    const socket = this.sockets.get(role);
    return {
      connection: this.connectionStates.get(role) ?? 'closed',
      pairingReady: this.pairingReady.get(role) ?? false,
      registered: socket?.authState.creds.registered ?? false,
    };
  }

  getQr(role: WhatsAppRole = 'receiver') {
    const qr = this.latestQrs.get(role);
    if (!qr) {
      throw new ServiceUnavailableException(
        `A ${role} QR code is not available yet. Wait for WhatsApp to initialize and try again.`,
      );
    }

    return { role, qr };
  }

   async sendTextMessage(phone: string, message: string) {
    const bot = this.sockets.get('bot');
    if (!bot || this.connectionStates.get('bot') !== 'open') {
      throw new Error('WhatsApp connection is not established.');
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const jid = `${
      cleanPhone.length === 10 ? cleanPhone + '@s.whatsapp.net' : cleanPhone + '@c.us'
    }`;

    await bot.sendMessage(jid, { text: message });
  }
}
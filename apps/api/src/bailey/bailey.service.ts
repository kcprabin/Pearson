import {
  Inject,
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
  WAMessage,
  fetchLatestBaileysVersion,
  jidNormalizedUser,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import axios from 'axios';
import { KafkaService } from '../kafka/kafka.service.js';
import { DRIZZLE } from '../database/database.module.js';

type WhatsAppRole = 'receiver' | 'bot';
type ConnectionState = 'connecting' | 'open' | 'closed';

@Injectable()
export class BaileysService implements OnModuleInit {
  private readonly logger = new Logger(BaileysService.name);
  private readonly restaurantInfoRequestMessage =
    'Hi! I am Pearson, your AI restaurant assistant. Before we add your menu, please send your restaurant details in this format:\n\nRestaurant name: Sunrise Cafe\nAddress: 123 Main Street, Kathmandu\nRestaurant phone number: 9800000000\nRestaurant email: hello@sunrisecafe.com\nOwner name: Ram Sharma\nOwner email: ram@sunrisecafe.com\nOwner phone number: 9811111111\n\nThis is demo data. Please replace it with your real restaurant details. After saving these details, I will ask you for your menu and help you manage orders.';
  private readonly sockets = new Map<WhatsAppRole, WASocket>();
  private readonly connectionStates = new Map<WhatsAppRole, ConnectionState>();
  private readonly pairingReady = new Map<WhatsAppRole, boolean>();
  private readonly latestQrs = new Map<WhatsAppRole, string>();
  private readonly threadIdsByJid = new Map<string, string>();
  private isPairing = false;
  private pairingRequest?: Promise<string>;
  private readyMessagePublished = false;

  constructor(
    private readonly kafkaService: KafkaService,
    @Inject(DRIZZLE) private readonly database: any,
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
        this.logger.log(
          `[bot] messages.upsert received: type=${type}, count=${messages.length}.`,
        );

        for (const message of messages) {
          const remoteJid = message.key.remoteJid ?? 'unknown sender';
          const messageContent = message.message;
          const text =
            messageContent?.conversation ??
            messageContent?.extendedTextMessage?.text ??
            undefined;

          this.logger.log(
            `[bot] WhatsApp message from ${remoteJid}: ${text ?? '[non-text message]'}`,
          );
        }

        if (type !== 'notify') {
          return;
        }

        for (const message of messages) {
          if (message.key.fromMe || !message.key.remoteJid) {
            continue;
          }

          await this.forwardIncomingMessage(message);
        }
      });
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
        this.readyMessagePublished = false;
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
          await this.publishReadyToGoLive();
        }
      }
    });
  }

  private async forwardIncomingMessage(message: WAMessage) {
    const agent = process.env.AGENT_URL ?? 'http://localhost:8000';
    const remoteJid = message.key.remoteJid;
    if (!remoteJid) {
      return;
    }

    const messageContent = message.message;
    const text =
      messageContent?.conversation ??
      messageContent?.extendedTextMessage?.text ??
      undefined;

    const thread_id = await this.getThreadIdForJid(remoteJid);
    if (!thread_id) {
      this.logger.warn(
        `No thread ID is mapped for incoming message from ${remoteJid}.`,
      );
      return;
    }

    try {
      const response = await axios.post(`${agent}/admin-chat-bot`, {
        message: text,
        thread_id: thread_id,
        timestamp: message.messageTimestamp,
      });
      if (response.data?.message) {
        await this.sendTextMessage(remoteJid, response.data.message);
      }
      this.logger.log(
        `Incoming bot message forwarded from ${remoteJid} using thread ${thread_id}.`,
      );
    } catch (error) {
      this.logger.error('Failed to forward incoming bot message.', error);
    }
  }

  private async getThreadIdForJid(jid: string): Promise<string | undefined> {
    const normalizedJid = jidNormalizedUser(jid);
    const directThreadId = this.threadIdsByJid.get(normalizedJid);
    if (directThreadId) {
      return directThreadId;
    }

    if (!jid.endsWith('@lid')) {
      return undefined;
    }

    const bot = this.sockets.get('bot');
    const phoneJid = await bot?.signalRepository.lidMapping.getPNForLID(jid);
    if (!phoneJid) {
      return undefined;
    }

    const threadId = this.threadIdsByJid.get(jidNormalizedUser(phoneJid));
    if (threadId) {
      this.threadIdsByJid.set(normalizedJid, threadId);
      return threadId;
    }

    const restaurant = await this.database.query.restaurantsTable.findFirst({
      where: (restaurants: any, { isNotNull }: any) =>
        isNotNull(restaurants.thread_id),
      orderBy: (restaurants: any, { desc }: any) => [
        desc(restaurants.createdAt),
      ],
    });
    if (restaurant?.thread_id) {
      this.threadIdsByJid.set(normalizedJid, restaurant.thread_id);
      this.logger.log(
        `Restored thread ${restaurant.thread_id} from the database for ${normalizedJid}.`,
      );
      return restaurant.thread_id;
    }

    return undefined;
  }

  private async publishReadyToGoLive() {
    if (
      this.readyMessagePublished ||
      this.connectionStates.get('receiver') !== 'open' ||
      this.connectionStates.get('bot') !== 'open'
    ) {
      return;
    }

    this.readyMessagePublished = true;
    const payload = {
      event: 'bot_receiver_connected',
      message: 'Welcome. The bot receiver is connected and ready to assist guests.',
      timestamp: new Date().toISOString(),
    };
    await this.kafkaService.sendMessage(
      'bot-receiver-connected',
      payload
    );
    this.logger.log('Bot receiver connected event published.');
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

    const jid = phone.includes('@')
      ? jidNormalizedUser(phone)
      : (() => {
          const cleanPhone = phone.replace(/\D/g, '');
          return cleanPhone.length === 10
            ? cleanPhone + '@s.whatsapp.net'
            : cleanPhone + '@c.us';
        })();

    await bot.sendMessage(jid, { text: message });
  }

  async sendToReceiver(
    message: string,
    fallbackPhone?: string,
    threadId?: string,
  ): Promise<boolean> {
    const bot = this.sockets.get('bot');
    const receiver = this.sockets.get('receiver');

    if (!bot || this.connectionStates.get('bot') !== 'open') {
      this.logger.warn('Bot WhatsApp connection is not open. Cannot send message to receiver.');
      return false;
    }

    const rawId = receiver?.user?.id;
    let targetJid: string | undefined;

    if (rawId) {
      targetJid = jidNormalizedUser(rawId);
    } else if (fallbackPhone) {
      const cleanPhone = fallbackPhone.replace(/\D/g, '');
      targetJid = cleanPhone.length === 10 ? cleanPhone + '@s.whatsapp.net' : cleanPhone + '@c.us';
    }

    if (!targetJid) {
      this.logger.warn('Receiver session is not connected or user ID is unavailable.');
      return false;
    }

    if (threadId) {
      this.threadIdsByJid.set(targetJid, threadId);
      const botLid = await bot.signalRepository.lidMapping.getLIDForPN(targetJid);
      if (botLid) {
        this.threadIdsByJid.set(jidNormalizedUser(botLid), threadId);
        this.logger.log(
          `Mapped receiver JID ${targetJid} and LID ${botLid} to thread ${threadId}.`,
        );
      }
    }

    await bot.sendMessage(targetJid, { text: message });
    this.logger.log(`Message successfully sent from bot to receiver WhatsApp (${targetJid}).`);
    return true;
  }
}
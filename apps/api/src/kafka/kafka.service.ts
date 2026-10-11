import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, type Producer } from 'kafkajs';

export const WHATSAPP_MESSAGES_TOPIC = 'whatsapp.messages';

@Injectable()
export class KafkaService implements OnModuleInit {
  private readonly logger = new Logger(KafkaService.name);
  private readonly kafka: Kafka;
  private readonly producer: Producer;

  constructor(private readonly configService: ConfigService) {
    const brokers = (this.configService.get<string>('KAFKA_BROKERS') ?? 'localhost:9092')
      .split(',')
      .map((broker) => broker.trim())
      .filter(Boolean);
    this.kafka = new Kafka({ clientId: 'pearson-api', brokers });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      const consumer = this.kafka.consumer({ groupId: 'pearson-hotel-consumer' });
      await consumer.connect();
      await consumer.subscribe({ topic: WHATSAPP_MESSAGES_TOPIC, fromBeginning: false });
      await consumer.run({
        eachMessage: async ({ message }) => {
          if (!message.value) {
            return;
          }

          await this.postToHotelModule(JSON.parse(message.value.toString()));
        },
      });
      this.logger.log('Kafka producer and consumer connected.');
    } catch (error) {
      this.logger.error(
        'Kafka connection failed. WhatsApp messages will not be published until Kafka is available.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async publishIncomingMessage(message: unknown) {
    await this.producer.send({
      topic: WHATSAPP_MESSAGES_TOPIC,
      messages: [{ value: JSON.stringify(message) }],
    });
    this.logger.log('Published incoming WhatsApp message to Kafka.');
  }

  private async postToHotelModule(message: unknown) {
    const port = this.configService.get<string>('PORT') ?? '3000';
    const response = await fetch(`http://127.0.0.1:${port}/hotel/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Hotel module rejected Kafka message with status ${response.status}.`);
    }

    this.logger.log('Consumed incoming WhatsApp message and posted it to the hotel module.');
  }
}
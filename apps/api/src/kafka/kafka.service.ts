import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit {
  private kafka: Kafka;
  private producer: Producer;
  private isConnected: boolean = false;
  private readonly logger = new Logger(KafkaService.name);

  onModuleInit() {
    this.connectProducer().catch((error) => {
      this.logError('Kafka producer connection setup failed.', error);
    });
  }

  constructor() {
    this.kafka = new Kafka({
      clientId: 'pearson-api',
      brokers: ['localhost:9092'],
    });
    this.producer = this.kafka.producer();
    this.connectProducer();
  }

  private async connectProducer() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected successfully.');
      this.isConnected = true;
    } catch (error) {
      this.logError('Error connecting Kafka producer.', error);
    }
  }

  async sendMessage(topic: string, message: unknown) {
    if (!this.isConnected) {
      this.logger.error(
        'Kafka producer is not connected. Cannot send message.',
      );
      return;
    }
    const data = typeof message === 'string' ? message : JSON.stringify(message);
    try {
      await this.producer.send({
        topic,
        messages: [{ value: data }],
      });
      this.logger.log(`Message sent to topic ${topic}: ${message}`);
    } catch (error) {
      this.logError(`Error sending message to Kafka topic "${topic}".`, error);
    }
  }

  async disconnectProducer() {
    if (!this.isConnected) {
      this.logger.error('Kafka producer is not connected. Cannot disconnect.');
      return;
    }
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      this.logger.log('Kafka producer disconnected successfully.');
    } catch (error) {
      this.logError('Error disconnecting Kafka producer.', error);
    }
  }

  private logError(message: string, error: unknown) {
    if (error instanceof Error) {
      this.logger.error(`${message} ${error.message}`, error.stack);
      return;
    }

    this.logger.error(`${message} Internal error: ${String(error)}`);
  }
}

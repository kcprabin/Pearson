import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { fileURLToPath } from 'node:url';
import { createObserveModule } from '@nestjs/observe';
import { DatabaseModule } from './database/database.module.js';
import { BaileysModule } from './bailey/bailey.module.js';
import { HotelModule } from './hotel/hotel.module.js';
import { KafkaService } from './kafka/kafka.service.js';
import { KafkaModule } from './kafka/kafka.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: fileURLToPath(new URL('../../../.env', import.meta.url)),
    }),  
    DatabaseModule,
    BaileysModule,
    HotelModule,
    KafkaModule,
  ],
  providers: [KafkaService],
  
})
export class AppModule {}

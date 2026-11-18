import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { fileURLToPath } from 'node:url';
import { DatabaseModule } from './database/database.module.js';
import { BaileysModule } from './bailey/bailey.module.js';
import { HotelModule } from './hotel/hotel.module.js';
import { KafkaModule } from './kafka/kafka.module.js';

import { AppController } from './app.controller.js';

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
  controllers: [AppController],
})
export class AppModule {}

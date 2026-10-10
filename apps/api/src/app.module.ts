import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { fileURLToPath } from 'node:url';
import { createObserveModule } from '@nestjs/observe';
import { DatabaseModule } from './database/database.module.js';
import { BaileysModule } from './bailey/bailey.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: fileURLToPath(new URL('../../../.env', import.meta.url)),
    }),
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'api',
    }),
    DatabaseModule,
    BaileysModule,
  ],
  
})
export class AppModule {}

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
    DatabaseModule,
    BaileysModule,
  ],
  
})
export class AppModule {}

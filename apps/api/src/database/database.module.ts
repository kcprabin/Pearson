// apps/api/src/database/database.module.ts
import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDBConnection } from '@Pearson/database';
import { sql } from 'drizzle-orm';

export const DRIZZLE = Symbol('DRIZZLE');

type Database = ReturnType<typeof createDBConnection>;
const logger = new Logger('Database');

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<Database> => {
        const url = configService.getOrThrow<string>('DATABASE_URL');
        const database = createDBConnection(url);

        try {
          await database.execute(sql`select 1`);
          logger.log('Database connected');
          return database;
        } catch (error) {
          logger.error('Database connection failed', error);
          throw error;
        }
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
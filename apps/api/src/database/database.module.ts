// apps/api/src/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDBConnection } from '@Pearson/database';

export const DRIZZLE = Symbol('DRIZZLE');

type Database = ReturnType<typeof createDBConnection>;

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Database => {
        const url = configService.getOrThrow<string>('DATABASE_URL');
        return createDBConnection(url);
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
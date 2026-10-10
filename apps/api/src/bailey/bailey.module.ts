import { Module, Global } from '@nestjs/common';
import { BaileysService } from './bailey.service.js'

@Global()
@Module({
  providers: [BaileysService],
  exports: [BaileysService],
})
export class BaileysModule {}
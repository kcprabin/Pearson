import { Module, Global } from '@nestjs/common';
import { BaileysService } from './bailey.service.js'
import { WhatsappController } from './bailey.controller.js';

@Global()
@Module({
  controllers: [WhatsappController],
  providers: [BaileysService],
  exports: [BaileysService],
})
export class BaileysModule {}
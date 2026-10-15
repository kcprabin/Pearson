import { Module, Global } from '@nestjs/common';
import { BaileysService } from './bailey.service.js';
import { WhatsappController } from './bailey.controller.js';
import { KafkaModule } from '../kafka/kafka.module.js';

@Global()
@Module({
  imports: [KafkaModule],
  controllers: [WhatsappController],
  providers: [BaileysService],
  exports: [BaileysService],
})
export class BaileysModule {}
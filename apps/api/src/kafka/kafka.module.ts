import { Module } from '@nestjs/common';
import { KafkaService } from './kafka.service.js';

@Module({
    providers: [KafkaService],
    exports: [KafkaService],
})
export class KafkaModule {}

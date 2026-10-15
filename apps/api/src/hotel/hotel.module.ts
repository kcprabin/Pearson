import { Module } from '@nestjs/common';
import { HotelController } from './hotel.controller.js';
import { HotelService } from './hotel.service.js';
import {KafkaModule} from '../kafka/kafka.module.js';


@Module({
  imports: [KafkaModule],
  controllers: [HotelController],
  providers: [HotelService],
  exports: [HotelService],
})
export class HotelModule {}

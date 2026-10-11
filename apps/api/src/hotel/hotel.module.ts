import { Module } from '@nestjs/common';
import { HotelController } from './hotel.controller.js';
import { HotelService } from './hotel.service.js';

@Module({
  controllers: [HotelController],
  providers: [HotelService],
  exports: [HotelService],
})
export class HotelModule {}

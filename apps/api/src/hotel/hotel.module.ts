import { Module } from '@nestjs/common';
import { HotelService } from './hotel.service.js';
import { HotelController } from './hotel.controller.js';

@Module({
  providers: [HotelService],
  controllers: [HotelController]
})
export class HotelModule {}

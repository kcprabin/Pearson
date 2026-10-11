import { Controller, Post , Body } from '@nestjs/common';
import { CreateRestroDto } from './dto/createrestro.dto.js';
import { HotelService } from './hotel.service.js';

@Controller('hotel')
export class HotelController {
    constructor(private readonly hotelService: HotelService) {}

    @Post('create')
    async createRestaurant(@Body() createRestroDto: CreateRestroDto) {
        return this.hotelService.createRestaurant(createRestroDto);
    }

    @Post('messages')
    async receiveWhatsAppMessage(@Body() message: unknown) {
        return this.hotelService.handleIncomingMessage(message);
    }



}

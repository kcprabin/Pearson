import { Controller, Post , Body } from '@nestjs/common';
import { CreateRestroDto,FirstLOginDto } from './dto/createrestro.dto.js';
import { HotelService } from './hotel.service.js';

@Controller('hotel')
export class HotelController {
    constructor(private readonly hotelService: HotelService) {}

    @Post('first-login')
    async firstLogin(@Body() firstLoginDto: FirstLOginDto) {
        return this.hotelService.firstLogin(firstLoginDto);
    }




}

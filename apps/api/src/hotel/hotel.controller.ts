import { Controller, Post, Body, Param } from '@nestjs/common';
import { FirstLOginDto,UpdateRestroDto } from './dto/createrestro.dto.js';
import { HotelService } from './hotel.service.js';

@Controller('hotel')
export class HotelController {
    constructor(private readonly hotelService: HotelService) {}

    @Post('first-login')
    async firstLogin(@Body() firstLoginDto: FirstLOginDto) {
        return this.hotelService.firstLogin(firstLoginDto);
    }

    @Post('update-restro/:thread_id')
    async updateRestro(
        @Param('thread_id') thread_id: string,
        @Body() updateRestroDto: Omit<UpdateRestroDto, 'thread_id'>,
    ) {
        return this.hotelService.updateRestro({
            ...updateRestroDto,
            thread_id,
        });
    }




}

import { Controller, Post, Body, Param, Res } from '@nestjs/common';
import {
  CheckUserDto,
  FirstLOginDto,
  UpdateRestroDto,
  LoginDto,
} from './dto/createrestro.dto.js';
import { HotelService } from './hotel.service.js';
import type { Response } from 'express';

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
    console.log(
      `[HotelController] POST /hotel/update-restro/${thread_id}`,
      updateRestroDto,
    );
    return this.hotelService.updateRestro({
      ...updateRestroDto,
      thread_id,
    });
  }

  @Post('generatepassword')
  async generatePassword() {
    return this.hotelService.generatePassword();
  }

  @Post('checkuser')
  async checkuser(@Body() params: CheckUserDto) {
    return this.hotelService.checkUser(params.phoneNumber);
  }

  @Post('login')
  async login(
    @Body() params: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.hotelService.login(params, res);
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    return this.hotelService.logout(res);
  }
}

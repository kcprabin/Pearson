import { Controller, Post, Body, Param, Res, Get } from '@nestjs/common';
import {
  CheckUserDto,
  FirstLOginDto,
  UpdateRestroDto,
  LoginDto,
  feedbackDto,
  orderByUserDto
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
  async generatePassword(@Body() params: { username: string }) {
    return this.hotelService.generatePassword(params);
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

  @Post('sendMessage/:thread_id')
  async chatWithBot(
    @Param('thread_id') thread_id: string,
    @Body() body: { message: string },
  ) {
    return this.hotelService.chatWithBot(thread_id, body.message);
  }

  @Post('feedback/:restaurant_id')
  async feedback(
    @Param('restaurant_id') restaurant_id: string,
    @Body() body: feedbackDto,
  ) {
    return this.hotelService.feedback(restaurant_id, body);
  }

  @Get('getRestaurant/:restaurant_id')
  async getRestaurant(@Param('restaurant_id') restaurant_id: string) {
    return this.hotelService.getRestaurant(restaurant_id);
  }

  @Get('getFeedback/:restaurant_id')
  async getFeedback(@Param('restaurant_id') restaurant_id: string) {
    return this.hotelService.getFeedback(restaurant_id);
  }

  @Post('Order/:restaurantId')
  async order(
    @Param('restaurantId') restaurantId: string,
    @Body() body: orderByUserDto ,
  ) {
    return this.hotelService.order(restaurantId, body);
  }
}

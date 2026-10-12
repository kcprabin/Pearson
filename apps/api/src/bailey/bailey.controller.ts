import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { BaileysService } from './bailey.service.js';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly baileysService: BaileysService) {}

  @Post('send')
  async sendMessage(@Body() body: { phone: string; message: string }) {
    await this.baileysService.sendTextMessage(body.phone, body.message);
    return { success: true, sentTo: body.phone };
  }

  @Get('status')
  async getStatus() {
    return this.baileysService.getStatus();
  }

  @Get('qr')
  async getQr(@Query('role') role: 'receiver' | 'bot' = 'receiver') {
    if (role !== 'receiver' && role !== 'bot') {
      throw new Error('role must be receiver or bot');
    }
    return this.baileysService.getQr(role);
  }

  

}
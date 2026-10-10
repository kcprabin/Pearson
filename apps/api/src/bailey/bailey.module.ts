import { Module } from '@nestjs/common';
import { BaileyService } from './bailey.service.js';
import { BaileyController } from './bailey.controller.js';

@Module({
  providers: [BaileyService],
  controllers: [BaileyController]
})
export class BaileyModule {}

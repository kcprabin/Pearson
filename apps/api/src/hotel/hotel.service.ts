import { Inject, Injectable, Logger } from '@nestjs/common';
import { schema } from '@Pearson/database';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module.js';
import type {
  CreateRestroDto,
  orderByUserDto,
  UpdateRestroDto,
  feedbackDto,
  FirstLOginDto,
} from './dto/createrestro.dto.js';
import { KafkaService } from '../kafka/kafka.service.js';
import { BaileysService } from '../bailey/bailey.service.js';
import axios from 'axios';

const { restaurantsTable } = schema;

@Injectable()
export class HotelService {
  private readonly logger = new Logger(HotelService.name);

  constructor(
    @Inject(DRIZZLE) private readonly database: any,
    private readonly kafkaService: KafkaService,
    private readonly baileysService: BaileysService,
  ) {}

  async firstLogin(firstLoginDto: FirstLOginDto) {
    const { restaurantName, ownerName } = firstLoginDto;
    const existingRestaurant =
      await this.database.query.restaurantsTable.findFirst({
        where: eq(restaurantsTable.restaurantName, restaurantName),
      });

    if (existingRestaurant) {
      throw new Error('Restaurant already exists.');
    }

    const id = crypto.randomUUID();
    let newRestaurant: any;

    try {
      const [created] = await this.database
        .insert(restaurantsTable)
        .values({
          restaurantName,
          ownerName,
          thread_id: id,
        })
        .returning();
      newRestaurant = created;
    } catch (error) {
      this.logger.error('Error creating restaurant:', error);
      throw new Error('Failed to create restaurant.');
    }

    const payload = {
      restaurantName: newRestaurant.restaurantName,
      ownerName: newRestaurant.ownerName,
      thread_id: newRestaurant.thread_id,
    };

    const agentUrl = process.env.AGENT_URL ?? 'http://localhost:8000';
    let agentData = null;

    try {
      const res = await axios.post(`${agentUrl}/admin-chat-bot`, payload);
      agentData = res.data;
      this.logger.log('Restaurant created event sent to agent successfully.');
    } catch (error) {
      this.logger.error('Error sending restaurant created event to agent:', error);
    }

    if (agentData?.message) {
      try {
        await this.baileysService.sendToReceiver(agentData.message);
      } catch (error) {
        this.logger.error('Failed to emit message to WhatsApp receiver:', error);
      }
    }

    await this.kafkaService.sendMessage('restaurant-created', payload);
    return {
      statusCode: 200,
      statusbar: 200,
      data: agentData,
      message: 'Restaurant created successfully.',
      convo_Id: newRestaurant.thread_id,
    };
  }
}

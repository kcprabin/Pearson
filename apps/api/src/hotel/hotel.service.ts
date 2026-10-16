import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { schema } from '@Pearson/database';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module.js';
import type {
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
    const { restaurantName, ownerName ,phoneNumber } = firstLoginDto;

    if (!phoneNumber) {
      throw new Error('Phone number must be between 10 and 15 digits.');
    }
    const existingRestaurant =
      await this.database.query.restaurantsTable.findFirst({
        where: eq(restaurantsTable.phoneNumber, String(phoneNumber)),
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
          phoneNumber: String(phoneNumber),
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
      this.logger.error(
        'Error sending restaurant created event to agent:',
        error,
      );
    }

    if (agentData?.message) {
      try {
        await this.baileysService.sendToReceiver(
          agentData.message,
          undefined,
          newRestaurant.thread_id,
        );
      } catch (error) {
        this.logger.error(
          'Failed to emit message to WhatsApp receiver:',
          error,
        );
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

  async updateRestro(updateRestroDto: UpdateRestroDto) {
    const {
      thread_id,
      RestaurantName,
      address ,
      phoneNumber,
      email,
      ownerName,
      ownerEmail,
      ownerPhoneNumber,
    } = updateRestroDto;

    if (!thread_id) {
      throw new Error('Thread ID is required.');
    }

    const existingRestaurant =
      await this.database.query.restaurantsTable.findFirst({
        where: eq(restaurantsTable.thread_id, thread_id),
      });

    if (!existingRestaurant) {
      throw new Error('Restaurant does not exist.');
    }

    const updateValues: Record<string, string | undefined> = {};
    if (RestaurantName !== undefined) updateValues.restaurantName = RestaurantName;
    if (address !== undefined) updateValues.address = address;
    if (phoneNumber !== undefined) updateValues.phoneNumber = String(phoneNumber);
    if (email !== undefined) updateValues.email = email;
    if (ownerName !== undefined) updateValues.ownerName = ownerName;
    if (ownerEmail !== undefined) updateValues.ownerEmail = ownerEmail;
    if (ownerPhoneNumber !== undefined) {
      updateValues.ownerPhoneNumber = String(ownerPhoneNumber);
    }

    if (Object.keys(updateValues).length === 0) {
      throw new BadRequestException(
        'At least one restaurant field is required to update.',
      );
    }

    try {
      await this.database
        .update(restaurantsTable)
        .set(updateValues)
        .where(eq(restaurantsTable.thread_id, thread_id));
    } catch (error) {
      this.logger.error('Error updating restaurant:', error);
      throw new Error('Failed to update restaurant.');
    }

    return {
      statusCode: 200,
      statusbar: 200,
      message: 'Restaurant updated successfully.',
    };
  }
}

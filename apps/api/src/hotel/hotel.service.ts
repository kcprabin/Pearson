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
import axios from 'axios';

const { restaurantsTable } = schema;

@Injectable()
export class HotelService {
  private readonly logger = new Logger(HotelService.name);

  constructor(
    @Inject(DRIZZLE) private readonly database: any,
    private readonly kafkaService: KafkaService,
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
    let newRestaurant;

    try {
       newRestaurant = await this.database
        .insert(restaurantsTable)
        .values({
          restaurantName,
          ownerName,
          thread_id: id,
        })
        .returning();
    } catch (error) {
      this.logger.error('Error creating restaurant:', error);
      throw new Error('Failed to create restaurant.');
    }

    const payload = {
      restaurantName: newRestaurant.restaurantName,
      ownerName: newRestaurant.ownerName,
      thread_id: newRestaurant.thread_id,
    };
    const response = await axios
      .post('http://localhost:3000/admin-chat-bot', payload)
      .then(() => {
        this.logger.log('Restaurant created event sent successfully.');
      })
      .catch((error) => {
        this.logger.error('Error sending restaurant created event.', error);
      });

    await this.kafkaService.sendMessage('restaurant-created', payload);
    return {
        statusbar: 200,
        data: response,
        message: 'Restaurant created successfully.',
        convo_Id: newRestaurant.thread_id,
    };
  }
}

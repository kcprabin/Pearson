import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { schema } from '@Pearson/database';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module.js';
import type {
  UpdateRestroDto,
  FirstLOginDto,
  CheckUserDto,
  LoginDto,
  feedbackDto,
} from './dto/createrestro.dto.js';
import { KafkaService } from '../kafka/kafka.service.js';
import { BaileysService } from '../bailey/bailey.service.js';
import axios from 'axios';
import jsonwebtoken from 'jsonwebtoken';
import type { Response } from 'express';

const { restaurantsTable, feedbackTable, ordersTable } = schema;

@Injectable()
export class HotelService {
  private readonly logger = new Logger(HotelService.name);

  constructor(
    @Inject(DRIZZLE) private readonly database: any,
    private readonly kafkaService: KafkaService,
    private readonly baileysService: BaileysService,
  ) {}

  async firstLogin(firstLoginDto: FirstLOginDto) {
    const {
      restaurantName,
      ownerName,
      phoneNumber,
      ownerPhoneNumber,
      address,
      email,
      ownerEmail,
    } = firstLoginDto;

    const normalizedPhone = String(phoneNumber ?? '').replace(/\D/g, '');
    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
      throw new BadRequestException(
        'Phone number must be between 10 and 15 digits.',
      );
    }

    const existingRestaurant =
      await this.database.query.restaurantsTable.findFirst({
        where: eq(restaurantsTable.phoneNumber, normalizedPhone),
      });

    if (existingRestaurant) {
      throw new ConflictException('Restaurant already exists.');
    }

    const id = crypto.randomUUID();
    let newRestaurant: any;
    let credentials: any;

    try {
      credentials = await this.generatePassword({ username: ownerName });
    } catch (error) {
      this.logger.error('Error generating credentials:', error);
      throw new InternalServerErrorException('Failed to generate credentials.');
    }

    try {
      const [created] = await this.database
        .insert(restaurantsTable)
        .values({
          restaurantName,
          ownerName,
          phoneNumber: normalizedPhone,
          ownerPhoneNumber: ownerPhoneNumber
            ? String(ownerPhoneNumber)
            : undefined,
          address,
          email,
          ownerEmail,
          thread_id: id,
          username: credentials.data.username,
          password: credentials.data.password,
        })
        .returning();
      newRestaurant = created;
    } catch (error) {
      this.logger.error('Error creating restaurant:', error);
      throw new InternalServerErrorException('Failed to create restaurant.');
    }

    const payload = {
      restaurant_id: newRestaurant.id,
      restaurantName: newRestaurant.restaurantName,
      ownerName: newRestaurant.ownerName,
      thread_id: newRestaurant.thread_id,
    };

    const agentUrl = process.env.AGENT_URL ?? 'http://localhost:8000';
    let agentData: any = null;

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
      data: credentials,
      message: 'Restaurant created successfully with id and password.',
      convo_Id: newRestaurant.thread_id,
    };
  }

  async updateRestro(updateRestroDto: UpdateRestroDto) {
    const {
      thread_id,
      RestaurantName,
      address,
      phoneNumber,
      email,
      ownerName,
      ownerEmail,
      ownerPhoneNumber,
    } = updateRestroDto;

    if (!thread_id) {
      throw new BadRequestException('Thread ID is required.');
    }

    const existingRestaurant =
      await this.database.query.restaurantsTable.findFirst({
        where: eq(restaurantsTable.thread_id, thread_id),
      });

    if (!existingRestaurant) {
      throw new NotFoundException('Restaurant does not exist.');
    }

    const updateValues: Record<string, string | undefined> = {};
    if (RestaurantName !== undefined)
      updateValues.restaurantName = RestaurantName;
    if (address !== undefined) updateValues.address = address;
    if (phoneNumber !== undefined)
      updateValues.phoneNumber = String(phoneNumber);
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
      throw new InternalServerErrorException('Failed to update restaurant.');
    }

    return {
      statusCode: 200,
      statusbar: 200,
      message: 'Restaurant updated successfully.',
    };
  }

  async generatePassword(body: { username: string }) {
    const { username } = body;
    const password = Math.random().toString(36).slice(-8);
    this.logger.log(
      `Generated restaurant login credentials: username=${username}, password=${password}`,
    );
    const credentials = { username, password };
    return {
      statusCode: 200,
      statusbar: 200,
      data: credentials,
      message: 'Password generated successfully.',
    };
  }

  async checkUser(phoneNumber: CheckUserDto['phoneNumber']) {
    const normalizedPhoneNumber = String(phoneNumber ?? '').replace(/\D/g, '');
    if (!normalizedPhoneNumber) {
      throw new BadRequestException('Phone number is required.');
    }

    const restaurant = await this.database.query.restaurantsTable.findFirst({
      where: eq(restaurantsTable.phoneNumber, normalizedPhoneNumber),
    });

    return {
      statusCode: 200,
      exists: Boolean(restaurant),
      message: restaurant
        ? 'User already exists.'
        : 'User does not exist. You can continue with first login.',
    };
  }

  async login(LoginDto: LoginDto, res: Response) {
    if (!LoginDto.username || !LoginDto.password) {
      throw new BadRequestException('Username and password are required.');
    }

    const normalizedUsername = String(LoginDto.username ?? '').trim();
    if (!normalizedUsername) {
      throw new BadRequestException('Username is required.');
    }
    const restaurant = await this.database.query.restaurantsTable.findFirst({
      where: eq(restaurantsTable.username, normalizedUsername),
    });

    if (!restaurant) {
      throw new NotFoundException('User does not exist.');
    }

    if (
      restaurant.username !== LoginDto.username ||
      restaurant.password !== LoginDto.password
    ) {
      throw new BadRequestException('Invalid username or password.');
    }

    const token = jsonwebtoken.sign(
      {
        id: restaurant.id,
        thread_id: restaurant.thread_id,
        restaurantName: restaurant.restaurantName,
        ownerName: restaurant.ownerName,
      },
      process.env.JWT_SECRET ?? 'default_secret',
      { expiresIn: '7D' },
    );
    await this.database
      .update(restaurantsTable)
      .set({ token })
      .where(eq(restaurantsTable.id, restaurant.id));

    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      statusCode: 200,
      statusbar: 200,
      message: 'Login successful.',
      data: {
        id: restaurant.id,
        restaurantName: restaurant.restaurantName,
        ownerName: restaurant.ownerName,
        phoneNumber: restaurant.phoneNumber,
        ownerPhoneNumber: restaurant.ownerPhoneNumber,
        address: restaurant.address,
        email: restaurant.email,
        ownerEmail: restaurant.ownerEmail,
        token: token,
      },
    };
  }

  async logout(res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
  }
  
  async chatWithBot(thread_id: string, message: string) {
    const restaurant = await this.database.query.restaurantsTable.findFirst({
      where: eq(restaurantsTable.thread_id, thread_id),
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant does not exist.');
    }

    return {
      statusCode: 200,
      statusbar: 200,
      message: 'Message sent to WhatsApp receiver successfully.',
    };
  } 

  async feedback(restaurant_id: string, feedback: feedbackDto) {
    const numericRestaurantId = Number(restaurant_id);
    if (!Number.isInteger(numericRestaurantId) || numericRestaurantId <= 0) {
      throw new BadRequestException('Restaurant ID must be a positive integer.');
    }

    const restaurant = await this.database.query.restaurantsTable.findFirst({
      where: eq(restaurantsTable.id, numericRestaurantId),
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant does not exist.');
    }

    try {
      await this.database.insert(feedbackTable)
        .values({
          restaurantId: numericRestaurantId,
          username: feedback.username,
          restaurantName: feedback.restaurantName,
          feedbackText: feedback.feedbackText,
          rating: feedback.rating,
        });
    } catch (error) {
      this.logger.error(
        'failed to insert feedback into database:',
        error,
      );
      throw new InternalServerErrorException(
        'Failed to insert feedback into database.',
      );
    }

    return {
      statusCode: 200,
      statusbar: 200,
      message: 'Feedback sent to database successfully.',
    };
  } 

  async getRestaurant(restaurant_id: string) {
    const numericRestaurantId = Number(restaurant_id);
    if (!Number.isInteger(numericRestaurantId) || numericRestaurantId <= 0) {
      throw new BadRequestException('Restaurant ID must be a positive integer.');
    }

    const restaurant = await this.database.query.restaurantsTable.findFirst({
      where: eq(restaurantsTable.id, numericRestaurantId),
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant does not exist.');
    }

    return {
      statusCode: 200,
      statusbar: 200,
      data: restaurant,
      message: 'Restaurant details fetched successfully.',
    };
  }

  async getFeedback(restaurant_id: string) {
    const numericRestaurantId = Number(restaurant_id);
    if (!Number.isInteger(numericRestaurantId) || numericRestaurantId <= 0) {
      throw new BadRequestException('Restaurant ID must be a positive integer.');
    }

    const feedback = await this.database.query.feedbackTable.findMany({
      where: eq(feedbackTable.restaurantId, numericRestaurantId),
    });

    return {
      statusCode: 200,
      statusbar: 200,
      data: feedback,
      message: 'Feedback fetched successfully.',
    };
  }
  
  async order(restaurantId: string, body: any) {
    const numericRestaurantId = Number(restaurantId);
    if (!Number.isInteger(numericRestaurantId) || numericRestaurantId <= 0) {
      throw new BadRequestException('Restaurant ID must be a positive integer.');
    }

    const restaurant = await this.database.query.restaurantsTable.findFirst({
      where: eq(restaurantsTable.id, numericRestaurantId),
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant does not exist.');
    }

    try {
      await this.database.insert(ordersTable)
        .values({
          restaurantId: numericRestaurantId,
          username: body.username,
          restaurantName: body.restaurantName,
          items: body.items,
          price: body.price,
          orderStatus: 'pending',
        });
    } catch (error) {
      this.logger.error(
        'failed to insert order into database:',
        error,
      );
      throw new InternalServerErrorException(
        'Failed to insert order into database.',
      );
    }

    return {
      statusCode: 200,
      statusbar: 200,
      message: 'Order placed successfully.',
    };
  } 

  async getOrders(restaurant_id: string) {
    const numericRestaurantId = Number(restaurant_id);
    if (!Number.isInteger(numericRestaurantId) || numericRestaurantId <= 0) {
      throw new BadRequestException('Restaurant ID must be a positive integer.');
    }

    const orders = await this.database.query.ordersTable.findMany({
      where: eq(ordersTable.restaurantId, numericRestaurantId),
    });

    return {
      statusCode: 200,
      statusbar: 200,
      data: orders,
      message: 'Orders fetched successfully.',
    };
  }

  async updateOrderStatus(order_id: string, status: string) {
    const numericOrderId = Number(order_id);
    if (!Number.isInteger(numericOrderId) || numericOrderId <= 0) {
      throw new BadRequestException('Order ID must be a positive integer.');
    }

    await this.database
      .update(ordersTable)
      .set({ orderStatus: status })
      .where(eq(ordersTable.id, numericOrderId));

    return {
      statusCode: 200,
      statusbar: 200,
      message: 'Order status updated successfully.',
    };
  }
}

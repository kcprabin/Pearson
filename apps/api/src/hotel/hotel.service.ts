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
} from './dto/createrestro.dto.js';
import { KafkaService } from '../kafka/kafka.service.js';
import { BaileysService } from '../bailey/bailey.service.js';
import axios from 'axios';
import jsonwebtoken from 'jsonwebtoken';
import type { Response } from 'express';

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
        })
        .returning();
      newRestaurant = created;
    } catch (error) {
      this.logger.error('Error creating restaurant:', error);
      throw new InternalServerErrorException('Failed to create restaurant.');
    }

    const credentials = await this.generatePassword();

    const payload = {
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

  async generatePassword() {
    const username = Math.random().toString(36).slice(-8);
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
    const restaurant = await this.database.query.restaurantsTable.findFirst({
      where: eq(restaurantsTable.ownerName, LoginDto.username),
    });

    if (!restaurant) {
      throw new NotFoundException('User does not exist.');
    }

    if (
      restaurant.ownerName !== LoginDto.username ||
      restaurant.password !== LoginDto.password
    ) {
      throw new BadRequestException('Invalid username or password.');
    }

    const token = jsonwebtoken.sign(
      {
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
      .where(eq(restaurantsTable.thread_id, restaurant.thread_id));

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
        thread_id: restaurant.thread_id,
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
}

import { Inject, Injectable } from '@nestjs/common';
import { schema } from '@Pearson/database';
import { DRIZZLE } from '../database/database.module.js';
import type { CreateRestroDto } from './dto/createrestro.dto.js';

const { restaurantsTable } = schema;

@Injectable()
export class HotelService {
    constructor(@Inject(DRIZZLE) private readonly database: any) {}

    async createRestaurant(createRestroDto: CreateRestroDto) {
        const [restaurant] = await this.database
            .insert(restaurantsTable)
            .values({
                restaurantName: createRestroDto.RestaurantName,
                address: createRestroDto.address,
                phoneNumber: String(createRestroDto.phoneNumber),
                email: createRestroDto.email,
                ownerName: createRestroDto.ownerName,
                ownerEmail: createRestroDto.ownerEmail,
                ownerPhoneNumber: String(createRestroDto.ownerPhoneNumber),
            })
            .returning();

        return {
            message: 'Restaurant created successfully',
            restaurant,
        };
    }

    handleIncomingMessage(message: unknown) {
        return {
            received: true,
            message,
        };
    }
}

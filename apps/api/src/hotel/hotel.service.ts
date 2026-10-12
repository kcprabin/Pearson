import { Inject, Injectable } from '@nestjs/common';
import { schema } from '@Pearson/database';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module.js';
import type { CreateRestroDto , orderByUserDto ,UpdateRestroDto , feedbackDto} from './dto/createrestro.dto.js';

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

    async updateRestaurant(id: number, updateRestroDto: UpdateRestroDto) {
        const [restaurant] = await this.database
            .update(restaurantsTable)
            .set({
                restaurantName: updateRestroDto.RestaurantName,
                address: updateRestroDto.address,
                phoneNumber: updateRestroDto.phoneNumber ? String(updateRestroDto.phoneNumber) : undefined,
                email: updateRestroDto.email,
                ownerName: updateRestroDto.ownerName,
                ownerEmail: updateRestroDto.ownerEmail,
                ownerPhoneNumber: updateRestroDto.ownerPhoneNumber ? String(updateRestroDto.ownerPhoneNumber) : undefined,
            })
            .where(eq(restaurantsTable.id, id))
            .returning();

        return {
            message: 'Restaurant updated successfully',
            restaurant,
        };
    }   

    async createOrder(orderData: orderByUserDto) {
        const [order] = await this.database
            .insert(schema.ordersTable)
            .values({
                ...orderData,
            })
            .returning();

        return {
            message: 'Order created successfully',
            order,
        };
    }

    async createFeedback(feedbackData: feedbackDto) {
        const [feedback] = await this.database
            .insert(schema.feedbackTable)
            .values({
                ...feedbackData,
            })
            .returning();

        return {
            message: 'Feedback created successfully',
            feedback,
        };
    }   

}

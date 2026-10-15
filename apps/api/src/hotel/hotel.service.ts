import { Inject, Injectable } from '@nestjs/common';
import { schema } from '@Pearson/database';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../database/database.module.js';
import type { CreateRestroDto , orderByUserDto ,UpdateRestroDto , feedbackDto, FirstLOginDto} from './dto/createrestro.dto.js';

const { restaurantsTable } = schema;

@Injectable()
export class HotelService {
    constructor(@Inject(DRIZZLE) private readonly database: any) {}

    async firstLogin(firstLoginDto: FirstLOginDto) {
        const { RestaurantName, Username } = firstLoginDto;
        const existingRestaurant = await this.database.query.restaurantsTable.findFirst({
            where: eq(restaurantsTable.RestaurantName, RestaurantName),
        });

        if (existingRestaurant) {
            throw new Error('Restaurant already exists.');
        }

        const newRestaurant = await this.database.insert(restaurantsTable).values({
            RestaurantName,
            Username,
        }).returning();

        return newRestaurant;

    }

}

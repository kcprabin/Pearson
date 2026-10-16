import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class FirstLOginDto {
  @IsString({ message: 'Restaurant name must be text.' })
  @IsNotEmpty({ message: 'Restaurant name is required.' })
  restaurantName: string;

  @IsString({ message: 'Username must be text.' })
  @IsNotEmpty({ message: 'Username is required.' })
  ownerName: string;

  @IsNotEmpty({ message: 'Phone number is required.' })
  phoneNumber: number;

  @IsOptional()
  @IsString({ message: 'Owner phone number must be text.' })
  ownerPhoneNumber?: string;

  @IsOptional()
  @IsString({ message: 'Address must be text.' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Email must be text.' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Owner email must be text.' })
  ownerEmail?: string;
}


export class CreateMenuDto {
  @IsNumber({}, { message: 'Restaurant ID must be a number.' })
  @IsNotEmpty({ message: 'Restaurant ID is required.' })
  restaurantId: number;

  @IsString({ message: 'Item name must be text.' })
  @IsNotEmpty({ message: 'Item name is required.' })
  itemName: string;

  @IsString({ message: 'Description must be text.' })
  description?: string;

  @IsNumber({}, { message: 'Price must be a number.' })
  @IsNotEmpty({ message: 'Price is required.' })
  @Min(0, { message: 'Price must not be negative.' })
  price: number;
}

export class UpdateRestroDto {
  @IsString({ message: 'Thread ID must be text.' })
  @IsNotEmpty({ message: 'Thread ID is required.' })
  thread_id: string;

  @IsOptional()
  @IsString({ message: 'Restaurant name must be text.' })
  RestaurantName?: string;

  @IsOptional()
  @IsString({ message: 'Address must be text.' })
  address?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Phone number must be a number.' })
  @Min(1000000000, { message: 'Phone number must have at least 10 digits.' })
  @Max(999999999999999, { message: 'Phone number must not exceed 15 digits.' })
  phoneNumber?: number;

  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address.' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Owner name must be text.' })
  ownerName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Owner email must be a valid email address.' })
  ownerEmail?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Owner phone number must be a number.' })
  @Min(1000000000, {
    message: 'Owner phone number must have at least 10 digits.',
  })
  @Max(999999999999999, {
    message: 'Owner phone number must not exceed 15 digits.',
  })
  ownerPhoneNumber?: number;
}

export class orderByUserDto {
  @IsString({ message: 'Username must be text.' })
  @IsNotEmpty({ message: 'Username is required.' })
  username: string;

  @IsNumber({}, { message: 'Restaurant ID must be a number.' })
  @IsNotEmpty({ message: 'Restaurant ID is required.' })
  restaurantId: number;

  @IsString({ message: 'Restaurant name must be text.' })
  @IsNotEmpty({ message: 'Restaurant name is required.' })
  restaurantName: string;

  @IsString({ message: 'Items must be text.' })
  @IsNotEmpty({ message: 'Items are required.' })
  items: string[];

  @IsNumber({}, { message: 'Total price must be a number.' })
  @IsNotEmpty({ message: 'Total price is required.' })
  @Min(0, { message: 'Total price must be a positive number.' })
  totalPrice: number;

  @IsDate({ message: 'Order date must be a valid date.' })
  @IsNotEmpty({ message: 'Order date is required.' })
  orderDate: Date;

  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';

}

export class updateOrderStatusDto {
  @IsString({ message: 'Order ID must be text.' })
  @IsNotEmpty({ message: 'Order ID is required.' })
  orderId: string;

  @IsString({ message: 'Status must be text.' })
  @IsNotEmpty({ message: 'Status is required.' })
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
}

export class feedbackDto {
  @IsString({ message: 'Order ID must be text.' })
  @IsNotEmpty({ message: 'Order ID is required.' })
  orderId: string;

  @IsNumber({}, { message: 'Restaurant ID must be a number.' })
  @IsNotEmpty({ message: 'Restaurant ID is required.' })
  restaurantId: number;

  @IsString({ message: 'Feedback must be text.' })
  @IsNotEmpty({ message: 'Feedback is required.' })
  feedback: string;
}



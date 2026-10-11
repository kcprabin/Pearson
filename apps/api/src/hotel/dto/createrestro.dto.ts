import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateRestroDto {
  @IsString({ message: 'Restaurant name must be text.' })
  @IsNotEmpty({ message: 'Restaurant name is required.' })
  RestaurantName: string;

  @IsString({ message: 'Address must be text.' })
  @IsNotEmpty({ message: 'Address is required.' })
  address: string;

  @IsNumber({}, { message: 'Phone number must be a number.' })
  @IsNotEmpty({ message: 'Phone number is required.' })
  @Min(1000000000, { message: 'Phone number must have at least 10 digits.' })
  @Max(999999999999999, { message: 'Phone number must not exceed 15 digits.' })
  phoneNumber: number;

  @IsEmail({}, { message: 'Email must be a valid email address.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  @IsString({ message: 'Owner name must be text.' })
  @IsNotEmpty({ message: 'Owner name is required.' })
  ownerName: string;

  @IsEmail({}, { message: 'Owner email must be a valid email address.' })
  @IsNotEmpty({ message: 'Owner email is required.' })
  ownerEmail: string;

  @IsNumber({}, { message: 'Owner phone number must be a number.' })
  @IsNotEmpty({ message: 'Owner phone number is required.' })
  @Min(1000000000, {
    message: 'Owner phone number must have at least 10 digits.',
  })
  @Max(999999999999999, {
    message: 'Owner phone number must not exceed 15 digits.',
  })
  ownerPhoneNumber: number;
}
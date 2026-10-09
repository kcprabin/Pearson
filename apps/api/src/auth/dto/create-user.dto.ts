import { IsEmail,  IsNotEmpty, IsString, MinLength } from 'class-validator'; 

export class CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  DOB: string;
}1
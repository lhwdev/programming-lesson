import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Length } from 'class-validator';

export class CreateProductDto {
    @IsNotEmpty()
    @IsString()
    @Length(2, 20)
    name: string;

    @IsNotEmpty()
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    price: number;

    @IsOptional()
    @IsString()
    description: string;
}

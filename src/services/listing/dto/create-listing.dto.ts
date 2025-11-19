import { IsBoolean, IsEnum, IsNumber, IsOptional, IsPositive, IsString, Length, Max } from 'class-validator';
import { ListingType } from '../../../shared/contracts/listing';

export class CreateListingDto {
  @IsString()
  @Length(6, 60)
  title!: string;

  @IsString()
  @Length(10, 500)
  description!: string;

  @IsNumber()
  @IsPositive()
  @Max(999999)
  price!: number;

  @IsEnum(['buy', 'sell', 'trade', 'other'])
  tradeType!: ListingType;

  @IsOptional()
  @IsString({ each: true })
  keywords?: string[];

  @IsOptional()
  @IsBoolean()
  aiAssist?: boolean;

  constructor(partial: Partial<CreateListingDto>) {
    Object.assign(this, partial);
  }
}

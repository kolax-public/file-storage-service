import { IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class CreateFileDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean = false;

  @IsNumber()
  @IsOptional()
  folderId?: number;
}

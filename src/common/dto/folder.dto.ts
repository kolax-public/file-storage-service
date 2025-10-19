import { IsString, IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  name: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean = false;

  @IsNumber()
  @IsOptional()
  parentId?: number;
}

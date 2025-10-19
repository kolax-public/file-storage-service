import { IsEmail, IsOptional, IsInt, IsEnum } from 'class-validator';


export enum Permission {
  VIEW = 'view',
  EDIT = 'edit',
}

export class CreateShareDto {  
  @IsEmail()
  email: string;
  
  @IsEnum(Permission)
  permission: Permission;
  
  @IsOptional()
  @IsInt()
  fileId?: number;
 
  @IsOptional()
  @IsInt()
  folderId?: number;
}
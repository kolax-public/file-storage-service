import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoldersController } from './folders.controller';
import { FoldersService } from './folders.service';
import { Folder } from './folder.entity';
import { UsersModule } from '../users/users.module';
import { FilesModule } from '../files/files.module';
import { Share } from '../shares/share.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Folder, Share]),
    UsersModule,
    FilesModule,
  ],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService], 
})
export class FoldersModule {}
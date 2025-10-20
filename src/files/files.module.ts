import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { File } from './file.entity';
import { UsersModule } from '../users/users.module';
import { Share } from '../shares/share.entity';

@Module({
  imports: [TypeOrmModule.forFeature([File, Share]), UsersModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}

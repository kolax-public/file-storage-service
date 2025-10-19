import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharesController } from './shares.controller';
import { SharesService } from './shares.service';
import { Share } from './share.entity';
import { UsersModule } from '../users/users.module';
import { FilesModule } from '../files/files.module';
import { FoldersModule } from '../folders/folders.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Share]),
    UsersModule,
    FilesModule,
    FoldersModule, 
  ],
  controllers: [SharesController],
  providers: [SharesService],
})
export class SharesModule {}
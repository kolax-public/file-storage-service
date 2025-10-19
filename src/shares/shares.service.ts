import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Share } from './share.entity';
import { UsersService } from '../users/users.service';
import { FilesService } from '../files/files.service';
import { FoldersService } from '../folders/folders.service';
import * as nodemailer from 'nodemailer';
import { v4 as uuid } from 'uuid';
import { CreateShareDto } from '../common/dto/share.dto';

@Injectable()
export class SharesService {
  private transporter;

  constructor(
    @InjectRepository(Share)
    private sharesRepository: Repository<Share>,
    private usersService: UsersService,
    private filesService: FilesService,
    private foldersService: FoldersService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async share(dto: CreateShareDto, userId: number) {
    console.log('SharesService.share input:', { dto, userId });
    const sharedWith = await this.usersService.findByEmail(dto.email);
    if (!sharedWith) throw new NotFoundException('User not found');

    if (!dto.fileId && !dto.folderId) {
      throw new BadRequestException('Either fileId or folderId must be provided');
    }

    if (dto.fileId) {
      const file = await this.filesService.getFile(dto.fileId, userId);
      if (!file) throw new NotFoundException('File not found');
    } else if (dto.folderId) {
      const folder = await this.foldersService.getFolder(dto.folderId, userId);
      if (!folder) throw new NotFoundException('Folder not found');
    }

    const shareLink = uuid();
    const share = this.sharesRepository.create({
      sharedWith: { id: sharedWith.id },
      permission: dto.permission,
      file: dto.fileId ? { id: dto.fileId } : null,
      folder: dto.folderId ? { id: dto.folderId } : null,
      shareLink,
    });
    await this.sharesRepository.save(share);

    // send email if need
    // await this.transporter.sendMail({
    //   from: process.env.EMAIL_FROM,
    //   to: dto.email,
    //   subject: 'Shared access',
    //   text: `Access link: http://localhost:3000/shares/${shareLink}`,
    // });

    return { shareLink };
  }

  async accessByLink(link: string, userId: number) {
    console.log('SharesService.accessByLink input:', { link, userId });
    const share = await this.sharesRepository.findOne({
      where: { shareLink: link },
      relations: ['file', 'folder', 'sharedWith'],
    });
    if (share?.sharedWith.id !== userId) throw new ForbiddenException();

    if (share.file) {
      const fileResponse = await this.filesService.getFileShared(share.file.id);
      return { ...fileResponse, permission: share.permission };
    } else if (share.folder) {
      const folderResponse = await this.foldersService.getFolderShared(share.folder.id);
      return { ...folderResponse, permission: share.permission };
    }
  }
}
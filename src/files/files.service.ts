import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { File } from './file.entity';
import { UsersService } from '../users/users.service';
import * as AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import { CreateFileDto } from '../common/dto/file.dto';
import { Share } from '../shares/share.entity';

@Injectable()
export class FilesService {
  private s3: AWS.S3;

  constructor(
    @InjectRepository(File)
    private filesRepository: Repository<File>,
    @InjectRepository(Share)    
    private sharesRepository: Repository<Share>,
    private usersService: UsersService,
    
  ) {
    this.s3 = new AWS.S3({
      endpoint: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
      accessKeyId: process.env.MINIO_ACCESS_KEY,
      secretAccessKey: process.env.MINIO_SECRET_KEY,
      s3ForcePathStyle: true,
    });
    
    this.s3.createBucket({ Bucket: process.env.MINIO_BUCKET }, (err) => {
      if (err && err.code !== 'BucketAlreadyOwnedByYou') console.error(err);
    });
  }

  async upload(file: Express.Multer.File, userId: number, dto: CreateFileDto) {
    if (file.size > 100 * 1024 * 1024) throw new Error('File too large');

    const key = `${uuid()}-${file.originalname}`;
    await this.s3.putObject({
      Bucket: process.env.MINIO_BUCKET,
      Key: key,
      Body: file.buffer,
      ACL: dto.isPublic ? 'public-read' : 'private',
    }).promise();

    const owner = await this.usersService.findById(userId);
    const newFile = this.filesRepository.create({
      name: dto.name || file.originalname,
      path: key,
      isPublic: dto.isPublic ?? false,
      owner,
      folder: dto.folderId ? { id: dto.folderId } as any : null,
    });
    return this.filesRepository.save(newFile);
  }


  async getFile(id: number, userId: number) {
    const file = await this.filesRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!file) throw new NotFoundException();

    const isOwner = file.owner?.id === userId;
    const isPublic = file.isPublic;

    if (isOwner || isPublic) {
      return this.fileResponse(file);
    }

    const shared = await this.sharesRepository.exists({
      where: {
        file: { id },
        sharedWith: { id: userId },
      },
    });

    if (shared) {
      return this.fileResponse(file);
    }

    throw new ForbiddenException();
  }
    
  async getFileShared(id: number, bypassPublicCheck = false) {
    const file = await this.filesRepository.findOne({ where: { id }});
    if (!file) throw new NotFoundException();

    if (!bypassPublicCheck && !file.isPublic) throw new ForbiddenException();

    const url = this.s3.getSignedUrl('getObject', { Bucket: process.env.MINIO_BUCKET, Key: file.path, Expires: 3600 });
    return { ...file, url };
  }


  async findAll(userId: number) {
    const ownerFiles = await this.filesRepository.find({
      where: { owner: { id: userId } },
    });

    const shares = await this.sharesRepository.find({
      where: { sharedWith: { id: userId } },
      relations: ['file'],
    });

    const sharedFiles = shares.map(item => item.file).filter(Boolean);

    // ownerFiles + sharedFiles
    const map = new Map<number, any>();
    for (const file of ownerFiles) map.set(file.id, file);
    for (const file of sharedFiles) if (file && !map.has(file.id)) map.set(file.id, file);

    return Array.from(map.values());
  }


  async search(name: string, userId: number) {
    const ownerFiles = await this.filesRepository.find({
      where: { name: Like(`%${name}%`), owner: { id: userId } },
    });

    const shares = await this.sharesRepository.find({
      where: { sharedWith: { id: userId } },
      relations: ['file'],
    });

    const sharedFiles = shares
      .map(s => s.file)
      .filter(f => f && f.name && f.name.toLowerCase().includes(name.toLowerCase()));

    const map = new Map<number, any>();
    for (const file of ownerFiles) map.set(file.id, file);
    for (const file of sharedFiles) if (file && !map.has(file.id)) map.set(file.id, file);

    return Array.from(map.values());
  }


  async delete(id: number, userId: number) {
    const file = await this.filesRepository.findOne({ where: { id }, relations: ['owner'] });
    if (!file) throw new NotFoundException();

    if (file.owner && file.owner.id === userId) {
      await this.s3.deleteObject({ Bucket: process.env.MINIO_BUCKET, Key: file.path }).promise();
      return this.filesRepository.remove(file);
    }

    const share = await this.sharesRepository.findOne({
      where: { file: { id }, sharedWith: { id: userId }, permission: 'edit' },
      relations: ['file'],
    });
    if (share) {
      await this.s3.deleteObject({ Bucket: process.env.MINIO_BUCKET, Key: file.path }).promise();
      return this.filesRepository.remove(file);
    }

    throw new ForbiddenException();
  }


  async update(id: number, dto: Partial<CreateFileDto>, userId: number) {
    const file = await this.filesRepository.findOne({ where: { id }, relations: ['owner'] });
    if (!file) throw new NotFoundException();
    if (dto.folderId) {
      file.folder = { id: dto.folderId } as any;
    }
    if (file.owner && file.owner.id === userId) {
      Object.assign(file, dto);
      return this.filesRepository.save(file);
    }

    const share = await this.sharesRepository.findOne({
      where: { file: { id }, sharedWith: { id: userId }, permission: 'edit' },
      relations: ['file'],
    });
    if (share) {
      Object.assign(file, dto);
      return this.filesRepository.save(file);
    }

    throw new ForbiddenException();
  }


  async clone(id: number, userId: number) {
    const file = await this.filesRepository.findOne({ where: { id }, relations: ['owner'] });
    if (!file || file.owner.id !== userId) throw new ForbiddenException();
    const newKey = `${uuid()}-${file.name}`;
    await this.s3.copyObject({
      Bucket: process.env.MINIO_BUCKET,
      CopySource: `${process.env.MINIO_BUCKET}/${file.path}`,
      Key: newKey,
    }).promise();
    const newFile = this.filesRepository.create({ ...file, path: newKey, id: undefined });
    return this.filesRepository.save(newFile);
  }

  private fileResponse(file: any) {
    const url = this.s3.getSignedUrl('getObject', {
      Bucket: process.env.MINIO_BUCKET,
      Key: file.path,
      Expires: 3600,
    });

    return { ...file, url };
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { File } from './file.entity';
import { UsersService } from '../users/users.service';
import * as AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';
import { CreateFileDto } from '../common/dto/file.dto';

@Injectable()
export class FilesService {
  private s3: AWS.S3;

  constructor(
    @InjectRepository(File)
    private filesRepository: Repository<File>,
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
    const file = await this.filesRepository.findOne({ where: { id }, relations: ['owner'] });
    if (!file) throw new NotFoundException();
        
    if (!file.isPublic && file.owner.id !== userId) throw new ForbiddenException();
    const url = this.s3.getSignedUrl('getObject', { Bucket: process.env.MINIO_BUCKET, Key: file.path, Expires: 3600 });
    return { ...file, url };
  }

  async getFileShared(id: number) {
    const file = await this.filesRepository.findOne({ where: { id }});
    if (!file) throw new NotFoundException();  
    if (!file.isPublic) throw new ForbiddenException();

    const url = this.s3.getSignedUrl('getObject', { Bucket: process.env.MINIO_BUCKET, Key: file.path, Expires: 3600 });
    return { ...file, url };
  }

  async findAll(userId: number) {
    return this.filesRepository.find({
      where: { owner: { id: userId } },
    });
  }

  async search(name: string, userId: number) {
    return this.filesRepository.find({
      where: { name: Like(`%${name}%`), owner: { id: userId } },
    });
  }

  async delete(id: number, userId: number) {
    const file = await this.filesRepository.findOne({ where: { id }, relations: ['owner'] });
    if (!file || file.owner.id !== userId) throw new ForbiddenException();
    await this.s3.deleteObject({ Bucket: process.env.MINIO_BUCKET, Key: file.path }).promise();
    return this.filesRepository.remove(file);
  }

  async update(id: number, dto: Partial<CreateFileDto>, userId: number) {
    const file = await this.filesRepository.findOne({ where: { id }, relations: ['owner'] });
    if (!file || file.owner.id !== userId) throw new ForbiddenException();
    Object.assign(file, dto);
    return this.filesRepository.save(file);
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
}

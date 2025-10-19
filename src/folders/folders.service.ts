import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Folder } from './folder.entity';
import { UsersService } from '../users/users.service';
import { CreateFolderDto } from '../common/dto/folder.dto';
import { FilesService } from '../files/files.service';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private foldersRepository: Repository<Folder>,
    private usersService: UsersService,
    private filesService: FilesService,
  ) {}

  async create(dto: CreateFolderDto, userId: number) {
    const owner = await this.usersService.findById(userId);
    const folder = this.foldersRepository.create({
      name: dto.name,
      isPublic: dto.isPublic ?? false,
      owner,
      parent: dto.parentId ? { id: dto.parentId } as any : null,
    });
    return this.foldersRepository.save(folder);
  }

  async getFolder(id: number, userId: number) {
    const folder = await this.foldersRepository.findOne({
      where: { id },
      relations: ['owner', 'children', 'files', 'parent'],
    });
    if (!folder) throw new NotFoundException();
    if (!folder.isPublic && folder.owner.id !== userId) throw new ForbiddenException();
    return folder;
  }

  async getFolderShared(id: number) {
    const folder = await this.foldersRepository.findOne({
      where: { id },
      relations: ['owner', 'children', 'files', 'parent']
    });
    if (!folder) throw new NotFoundException();
    return folder;
  }

  async findAll(userId: number) {
    return this.foldersRepository.find({
      where: { owner: { id: userId }},
      relations: ['owner', 'children', 'files', 'parent']
    });
  }

  async search(name: string, userId: number) {
    return this.foldersRepository.find({
      where: { name: Like(`%${name}%`), owner: { id: userId }},
      relations: ['owner', 'children', 'files', 'parent']
    });
  }

  async delete(id: number, userId: number) {
    const folder = await this.getFolder(id, userId);
    // Рекурсивно удалить файлы и подпапки
    for (const file of folder.files || []) {
      await this.filesService.delete(file.id, userId);
    }
    for (const child of folder.children || []) {
      await this.delete(child.id, userId);
    }
    return this.foldersRepository.remove(folder);
  }

  async update(id: number, dto: Partial<CreateFolderDto>, userId: number) {
    const folder = await this.foldersRepository.findOne({ where: { id }, relations: ['owner'] });
    if (!folder || folder.owner.id !== userId) throw new ForbiddenException();
    Object.assign(folder, dto);
    return this.foldersRepository.save(folder);
  }
}

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Folder } from './folder.entity';
import { UsersService } from '../users/users.service';
import { CreateFolderDto } from '../common/dto/folder.dto';
import { FilesService } from '../files/files.service';
import { Share } from '../shares/share.entity';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private foldersRepository: Repository<Folder>,
    @InjectRepository(Share)    
    private sharesRepository: Repository<Share>,
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

    const isOwner = folder.owner?.id === userId;

    if (isOwner || folder.isPublic) {
      return folder;
    }

    const shared = await this.sharesRepository.exists({
      where: {
        folder: { id },
        sharedWith: { id: userId },
      },
    });

    if (shared) return folder;

    throw new ForbiddenException();
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
    const ownFolders = await this.foldersRepository.find({
      where: { owner: { id: userId } },
      relations: ['owner', 'children', 'files', 'parent']
    });

    const sharedFolders = await this.foldersRepository
      .createQueryBuilder('folder')
      .innerJoin('folder.shares', 'share')
      .where('share.sharedWithId = :userId', { userId })
      .getMany();

    const unique = new Map(ownFolders.concat(sharedFolders).map(f => [f.id, f]));
    return Array.from(unique.values());
  }


  async search(name: string, userId: number) {
    return this.foldersRepository.find({
      where: { name: Like(`%${name}%`), owner: { id: userId }},
      relations: ['owner', 'children', 'files', 'parent']
    });
  }  

  async delete(id: number, userId: number) {
    const folder = await this.foldersRepository.findOne({
      where: { id },
      relations: ['owner', 'files', 'children'],
    });
    if (!folder) throw new NotFoundException();

    const isOwner = folder.owner?.id === userId;

    const canEdit = isOwner || await this.sharesRepository.exists({
      where: {
        folder: { id },
        sharedWith: { id: userId },
        permission: 'edit',
      },
    });

    if (!canEdit) throw new ForbiddenException();
console.log('canEdit', canEdit);
    if (folder.files?.length) {
      for (const file of folder.files) {
        await this.filesService.delete(file.id, userId);
      }
    }

    if (folder.children?.length) {
      for (const child of folder.children) {
        await this.delete(child.id, userId);
      }
    }

    await this.foldersRepository.remove(folder);

    return { message: 'Folder deleted successfully' };
  }

  async update(id: number, dto: Partial<CreateFolderDto>, userId: number) {
    const folder = await this.foldersRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!folder) throw new NotFoundException();

    const isOwner = folder.owner?.id === userId;

    const canEdit = isOwner || await this.sharesRepository.exists({
      where: {
        folder: { id },
        sharedWith: { id: userId },
        permission: 'edit',
      },
    });

    if (!canEdit) throw new ForbiddenException();

    Object.assign(folder, dto);
    return this.foldersRepository.save(folder);
  }

}

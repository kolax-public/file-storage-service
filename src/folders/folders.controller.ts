import { Controller, Post, Get, Param, Body, UseGuards, Req, Delete, Patch, Query } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateFolderDto } from '../common/dto/folder.dto';

@ApiTags('folders')
@Controller('folders')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('jwt')
export class FoldersController {
  constructor(private foldersService: FoldersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new folder' })
  @ApiBody({
    type: CreateFolderDto,
    description: 'Details of the folder to be created',
    examples: {
      createRootFolder: {
        summary: 'Create a root folder',
        description: 'Example of creating a folder without a parent',
        value: {
          name: 'MyFolder',
          isPublic: false,
        },
      },
      createNestedFolder: {
        summary: 'Create a nested folder',
        description: 'Example of creating a folder inside another folder',
        value: {
          name: 'NestedFolder',
          isPublic: true,
          parentId: 1,
        },
      },
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Folder created successfully', 
    type: Object, 
    example: {
      id: 1,
      name: 'MyFolder',
      isPublic: false,
      parentId: null,
      ownerId: 1,
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() dto: CreateFolderDto, @Req() req) {
    return this.foldersService.create(dto, req.user.id);
  }

  @Get() 
  async all(@Req() req) {
    return this.foldersService.findAll(req.user.id);
  }

  @Get('search')
  @ApiQuery({ name: 'name', type: String, description: 'Folder name to search for', example: 'MyFolder' })  
  async search(@Query('name') name: string, @Req() req) {
    return this.foldersService.search(name, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a folder by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Folder ID', example: 1 })
  async get(@Param('id') id: number, @Req() req) {
    return this.foldersService.getFolder(id, req.user.id);
  }


  @Delete(':id')
  @ApiParam({ name: 'id', type: Number, description: 'Folder ID', example: 1 })
  async delete(@Param('id') id: number, @Req() req) {
    return this.foldersService.delete(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a folder by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Folder ID', example: 1 })
  @ApiBody({
    type: CreateFolderDto,
    description: 'Fields to update for the folder',
    examples: {
      updateName: {
        summary: 'Update folder name',
        description: 'Example of updating only the folder name',
        value: {
          name: 'UpdatedFolder',
        },
      },
      updatePublicAndParent: {
        summary: 'Update public status and parent',
        description: 'Example of updating isPublic and parentId',
        value: {
          isPublic: true,
          parentId: 2,
        },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Folder updated successfully', 
    type: Object, 
    example: {
      id: 1,
      name: 'UpdatedFolder',
      isPublic: true,
      parentId: 2,
      ownerId: 1,
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Folder not found' })
  async update(@Param('id') id: number, @Body() dto: Partial<CreateFolderDto>, @Req() req) {
    return this.foldersService.update(id, dto, req.user.id);
  }
}
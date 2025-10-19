import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateFileDto } from '../common/dto/file.dto';

@ApiTags('files')
@Controller('files')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('jwt')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
   @ApiOperation({ summary: 'Upload a new file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload with metadata',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload',
        },
        name: {
          type: 'string',
          description: 'File name',
          example: 'test.txt',
        },
        folderId: {
          type: 'number',
          description: 'Optional folder ID',
          example: 1,
          nullable: true,
        },
      },
      required: ['file', 'name'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async upload(@UploadedFile() file, @Req() req, @Body() body: CreateFileDto) {
    return this.filesService.upload(file, req.user.id, body);
  }

  @Get()
  async all(@Req() req) {
    return this.filesService.findAll(req.user.id);
  }

  @Get('search')
  async search(@Query('name') name: string, @Req() req) {
    return this.filesService.search(name, req.user.id);
  }

  @Get(':id')
  async get(@Param('id') id: number, @Req() req) {
    return this.filesService.getFile(id, req.user.id);
  }


  @Delete(':id')
  async delete(@Param('id') id: number, @Req() req) {
    return this.filesService.delete(id, req.user.id);
  }

   @Patch(':id')
  @ApiOperation({ summary: 'Update a file by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'File ID', example: 1 })
  @ApiBody({
    type: CreateFileDto,
    description: 'Fields to update for the file',
    examples: {
      updateName: {
        summary: 'Update file name',
        description: 'Example of updating only the file name',
        value: {
          name: 'updated_document.txt',
        },
      },
      updatePublicAndFolder: {
        summary: 'Update public status and folder',
        description: 'Example of updating isPublic and folderId',
        value: {
          isPublic: true,
          folderId: 2,
        },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'File updated successfully', 
    type: Object, 
    example: {
      id: 1,
      name: 'updated_document.txt',
      path: 'files/1/123456789_document.txt',
      isPublic: true,
      folderId: 2,
      ownerId: 1,
      url: 'http://localhost:9000/files/1/123456789_document.txt?AWSAccessKeyId=...',
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async update(@Param('id') id: number, @Body() dto: Partial<CreateFileDto>, @Req() req) {
    return this.filesService.update(id, dto, req.user.id);
  }

  @Post(':id/clone')
  async clone(@Param('id') id: number, @Req() req) {
    return this.filesService.clone(id, req.user.id);
  }
}

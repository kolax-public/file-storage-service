import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { SharesService } from './shares.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CreateShareDto } from '../common/dto/share.dto';

@ApiTags('shares')
@Controller('shares')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('jwt')
export class SharesController {
  constructor(private readonly sharesService: SharesService) {}

  @Post()
  @ApiOperation({ summary: 'Share a file or folder with another user' })
  @ApiBody({
    type: CreateShareDto,
    description: 'Details of the share to be created',
    examples: {
      shareFile: {
        summary: 'Share a file',
        description: 'Example of sharing a file with view permission',
        value: {
          email: 'user@example.com',
          permission: 'view',
          fileId: 1,
        },
      },
      shareFolder: {
        summary: 'Share a folder',
        description: 'Example of sharing a folder with edit permission',
        value: {
          email: 'user@example.com',
          permission: 'edit',
          folderId: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Share created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User, file, or folder not found' })
  async share(@Body() dto: CreateShareDto, @Req() req) {
    return this.sharesService.share(dto, req.user.id);
  }

  @Get(':link')
  @ApiOperation({ summary: 'Access a shared file or folder by link' })
  @ApiParam({ name: 'link', type: String, description: 'Unique share link', example: 'abc123' })
  @ApiResponse({ status: 200, description: 'Shared resource accessed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Access forbidden' })
  @ApiResponse({ status: 404, description: 'Share or resource not found' })
  async accessByLink(@Param('link') link: string, @Req() req) {
    return this.sharesService.accessByLink(link, req.user.id);
  }
}
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';

@ApiTags('announcements')
@Controller('announcements')
export class PublicAnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get('active')
  @ApiOperation({ summary: 'Get currently active system announcements' })
  getActive() {
    return this.announcementsService.getActive();
  }
}

@ApiTags('admin-announcements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/announcements')
export class AdminAnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: 'List all announcements with pagination' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.announcementsService.findAll({ page, limit });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new announcement' })
  create(@Body() dto: any, @GetUser() admin: any, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.announcementsService.create(dto, admin, ip);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing announcement' })
  update(
    @Param('id') id: string,
    @Body() dto: any,
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.announcementsService.update(id, dto, admin, ip);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an announcement' })
  delete(@Param('id') id: string, @GetUser() admin: any, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.announcementsService.delete(id, admin, ip);
  }
}


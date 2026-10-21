import { Controller, Get, Patch, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';

@ApiTags('settings')
@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  @ApiOperation({ summary: 'Get public platform settings flags' })
  getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }
}

@ApiTags('admin-settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all platform game settings' })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @ApiOperation({ summary: 'Update platform game settings' })
  updateSettings(
    @Body() dto: any,
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.settingsService.updateSettings(dto, admin, ip);
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset platform game settings to defaults' })
  resetSettings(
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.settingsService.resetSettings(admin, ip);
  }
}


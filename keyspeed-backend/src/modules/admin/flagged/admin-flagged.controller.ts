import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminFlaggedService } from './admin-flagged.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';

@ApiTags('admin-flagged')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/flagged')
export class AdminFlaggedController {
  constructor(private readonly flaggedService: AdminFlaggedService) {}

  @Get()
  @ApiOperation({ summary: 'List flagged results queue for anti-cheat review' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.flaggedService.findAll({ page, limit, status });
  }

  @Post(':resultId/approve')
  @ApiOperation({ summary: 'Approve a flagged result and include in leaderboard' })
  approve(
    @Param('resultId') resultId: string,
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.flaggedService.approveResult(resultId, admin, ip);
  }

  @Post(':resultId/reject')
  @ApiOperation({ summary: 'Reject a flagged result and keep excluded' })
  reject(
    @Param('resultId') resultId: string,
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.flaggedService.rejectResult(resultId, admin, ip);
  }

  @Post(':resultId/reject-and-ban')
  @ApiOperation({ summary: 'Reject result and ban the offending racer' })
  rejectAndBan(
    @Param('resultId') resultId: string,
    @Body('reason') reason: string,
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.flaggedService.rejectAndBan(resultId, reason, admin, ip);
  }
}


import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminLiveService } from './admin-live.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';

@ApiTags('admin-live')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/live')
export class AdminLiveController {
  constructor(private readonly liveService: AdminLiveService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get live snapshot of online users, active rooms, and queue' })
  getLiveSummary() {
    return this.liveService.getLiveSummary();
  }

  @Post('rooms/:id/close')
  @ApiOperation({ summary: 'Close an active room immediately' })
  closeRoom(
    @Param('id') id: string,
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.liveService.closeRoom(id, admin, ip);
  }

  @Post('users/:id/disconnect')
  @ApiOperation({ summary: 'Disconnect a user from live sessions' })
  disconnectUser(
    @Param('id') id: string,
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.liveService.disconnectUser(id, admin, ip);
  }
}


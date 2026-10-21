import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminLeaderboardService } from './admin-leaderboard.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';

@ApiTags('admin-leaderboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/leaderboard')
export class AdminLeaderboardController {
  constructor(private readonly leaderboardService: AdminLeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get current leaderboard ranking with result references' })
  getLeaderboard(@Query('scope') scope?: 'alltime' | 'daily') {
    return this.leaderboardService.getLeaderboards(scope);
  }

  @Delete(':resultId')
  @ApiOperation({ summary: 'Remove a suspicious entry from the leaderboard' })
  removeEntry(
    @Param('resultId') resultId: string,
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.leaderboardService.removeEntry(resultId, admin, ip);
  }

  @Post('reset-daily')
  @ApiOperation({ summary: 'Reset daily leaderboard' })
  resetDaily(@GetUser() admin: any, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.leaderboardService.resetDaily(admin, ip);
  }

  @Post('recalculate')
  @ApiOperation({ summary: 'Recalculate all-time statistics and leaderboards from valid runs' })
  recalculate(@GetUser() admin: any, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.leaderboardService.recalculateAll(admin, ip);
  }
}


import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OverviewService } from './overview.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';

@ApiTags('admin-overview')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/stats')
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get overview dashboard counters and recent activities' })
  getOverview() {
    return this.overviewService.getOverview();
  }

  @Get('charts')
  @ApiOperation({ summary: 'Get trend charts for signups, races, WPM and mode split' })
  getCharts(@Query('range') range?: number) {
    return this.overviewService.getCharts(range);
  }
}


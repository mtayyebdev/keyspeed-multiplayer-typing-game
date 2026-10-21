import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminRacesService } from './admin-races.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';

@ApiTags('admin-races')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/races')
export class AdminRacesController {
  constructor(private readonly racesService: AdminRacesService) {}

  @Get()
  @ApiOperation({ summary: 'Paginated race list with filters' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('mode') mode?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('isPrivate') isPrivate?: string,
    @Query('hasBots') hasBots?: string,
    @Query('hasFlagged') hasFlagged?: string,
  ) {
    return this.racesService.findAll({
      page,
      limit,
      mode,
      startDate,
      endDate,
      isPrivate,
      hasBots,
      hasFlagged,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get race detail with player results and text used' })
  findById(@Param('id') id: string) {
    return this.racesService.findById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a race and recalculate affected user stats' })
  deleteRace(
    @Param('id') id: string,
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.racesService.deleteRace(id, admin, ip);
  }
}


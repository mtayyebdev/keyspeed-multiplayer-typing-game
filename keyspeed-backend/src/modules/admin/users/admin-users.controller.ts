import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminUsersService } from './admin-users.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';

@ApiTags('admin-users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Paginated user list with filters and search' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortField') sortField?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.usersService.findAll({
      page,
      limit,
      search,
      role,
      status,
      startDate,
      endDate,
      sortField,
      sortOrder,
    });
  }

  @Get('export')
  @ApiOperation({ summary: 'Export user list for CSV' })
  exportUsers(
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.usersService.exportUsers({ role, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user details with race history and audit logs' })
  findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit username and email' })
  updateUser(
    @Param('id') id: string,
    @Body() dto: { username?: string; email?: string },
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.usersService.updateUser(id, dto, admin, ip);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Change user role (user/admin)' })
  changeRole(
    @Param('id') id: string,
    @Body('role') role: 'user' | 'admin',
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.usersService.changeRole(id, role, admin, ip);
  }

  @Post(':id/ban')
  @ApiOperation({ summary: 'Ban a user with a reason' })
  banUser(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.usersService.banUser(id, reason, admin, ip);
  }

  @Post(':id/unban')
  @ApiOperation({ summary: 'Unban a user' })
  unbanUser(
    @Param('id') id: string,
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.usersService.unbanUser(id, admin, ip);
  }

  @Post(':id/reset-stats')
  @ApiOperation({ summary: 'Reset a user stats' })
  resetStats(
    @Param('id') id: string,
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.usersService.resetStats(id, admin, ip);
  }

  @Post(':id/force-logout')
  @ApiOperation({ summary: 'Force logout by invalidating token version' })
  forceLogout(
    @Param('id') id: string,
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.usersService.forceLogout(id, admin, ip);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Permanently delete user' })
  deleteUser(
    @Param('id') id: string,
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.usersService.deleteUser(id, admin, ip);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Perform bulk action on users' })
  bulkAction(
    @Body() dto: { userIds: string[]; action: 'ban' | 'unban' | 'delete'; reason?: string },
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.usersService.bulkAction(dto, admin, ip);
  }
}


import { Controller, Get, Put, Delete, Body, Param, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  async getMe(@GetUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  @Get('me/results')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get last 10 race results of current user' })
  async getMyResults(@GetUser('sub') userId: string) {
    return this.usersService.getMyResults(userId);
  }

  @Put('change-password')
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // Max 5 password changes per 5 minutes
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for currently authenticated user' })
  async changePassword(
    @GetUser('sub') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Delete('me')
  @Throttle({ default: { limit: 2, ttl: 600000 } }) // Max 2 delete attempts per 10 minutes
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete racer account and race results' })
  async deleteAccount(
    @GetUser('sub') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.usersService.deleteAccount(userId);

    // Clear auth cookie
    res.clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return result;
  }

  @Get(':username')
  @ApiOperation({ summary: 'Get public racer profile and stats' })
  async getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }
}


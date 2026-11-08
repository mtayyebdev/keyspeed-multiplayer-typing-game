import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get top 20 racers for alltime or daily' })
  @ApiQuery({ name: 'scope', enum: ['daily', 'alltime'], required: false })
  @ApiQuery({ name: 'gameId', required: false })
  async getLeaderboard(
    @Query('scope') scope: 'daily' | 'alltime' = 'alltime',
    @Query('gameId') gameId: string = 'classic-race',
  ) {
    return this.leaderboardService.getLeaderboard(scope, gameId);
  }
}


import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RaceResult, RaceResultDocument } from '../races/schemas/race-result.schema';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel(RaceResult.name)
    private raceResultModel: Model<RaceResultDocument>,
  ) {}

  async getLeaderboard(
    scope: 'daily' | 'alltime' = 'alltime',
    gameId: string = 'classic-race',
  ) {
    const matchFilter: any = {
      isBot: false,
      flagged: false,
      userId: { $ne: null },
    };

    if (gameId === 'classic-race') {
      matchFilter.$or = [{ gameId: 'classic-race' }, { gameId: { $exists: false } }];
    } else {
      matchFilter.gameId = gameId;
    }

    if (scope === 'daily') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      matchFilter.createdAt = { $gte: startOfDay };
    }

    // Aggregate highest WPM per user in scope, sorted descending, limit 20
    const leaders = await this.raceResultModel.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$userId',
          bestWpm: { $max: '$wpm' },
          bestAccuracy: { $max: '$accuracy' },
          latestRun: { $max: '$createdAt' },
          totalRaces: { $sum: 1 },
        },
      },
      { $sort: { bestWpm: -1, bestAccuracy: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          userId: '$_id',
          username: '$user.username',
          wpm: '$bestWpm',
          accuracy: '$bestAccuracy',
          racesPlayed: '$user.racesPlayed',
          racesWon: '$user.racesWon',
          createdAt: '$latestRun',
        },
      },
    ]);

    return leaders.map((leader, index) => ({
      rank: index + 1,
      ...leader,
    }));
  }
}


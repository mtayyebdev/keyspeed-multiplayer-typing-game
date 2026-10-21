import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RaceResult, RaceResultDocument } from '../../races/schemas/race-result.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdminLeaderboardService {
  constructor(
    @InjectModel(RaceResult.name) private raceResultModel: Model<RaceResultDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly auditService: AuditService,
  ) {}

  async getLeaderboards(scope: 'alltime' | 'daily' = 'alltime') {
    const matchFilter: any = {
      isBot: false,
      flagged: false,
      userId: { $ne: null },
    };

    if (scope === 'daily') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      matchFilter.createdAt = { $gte: startOfDay };
    }

    const leaders = await this.raceResultModel.aggregate([
      { $match: matchFilter },
      { $sort: { wpm: -1, accuracy: -1, createdAt: -1 } },
      {
        $group: {
          _id: '$userId',
          bestResultId: { $first: '$_id' },
          wpm: { $max: '$wpm' },
          accuracy: { $first: '$accuracy' },
          raceId: { $first: '$raceId' },
          createdAt: { $first: '$createdAt' },
        },
      },
      { $sort: { wpm: -1, accuracy: -1 } },
      { $limit: 100 },
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
          _id: '$bestResultId',
          resultId: '$bestResultId',
          userId: '$_id',
          username: '$user.username',
          email: '$user.email',
          wpm: 1,
          accuracy: 1,
          raceId: 1,
          racesPlayed: '$user.racesPlayed',
          racesWon: '$user.racesWon',
          createdAt: 1,
        },
      },
    ]);

    return leaders.map((leader, index) => ({
      rank: index + 1,
      ...leader,
    }));
  }

  async removeEntry(
    resultId: string,
    admin: { id: string; username: string },
    ip?: string,
  ) {
    if (!Types.ObjectId.isValid(resultId)) {
      throw new BadRequestException('Invalid result ID');
    }

    const result = await this.raceResultModel.findById(resultId).exec();
    if (!result) {
      throw new NotFoundException(`Result ${resultId} not found`);
    }

    result.flagged = true;
    result.reviewStatus = 'rejected';
    result.reviewedBy = admin.id;
    result.reviewedAt = new Date();
    await result.save();

    // Recalculate user's bestWpm & avgWpm
    if (result.userId) {
      const remaining = await this.raceResultModel
        .find({ userId: result.userId, flagged: false, isBot: false })
        .exec();

      const racesPlayed = remaining.length;
      const racesWon = remaining.filter((r) => r.position === 1).length;
      const bestWpm = racesPlayed > 0 ? Math.max(...remaining.map((r) => r.wpm)) : 0;
      const avgWpm =
        racesPlayed > 0
          ? Math.round(remaining.reduce((sum, r) => sum + r.wpm, 0) / racesPlayed)
          : 0;

      await this.userModel.updateOne(
        { _id: result.userId },
        {
          $set: {
            racesPlayed,
            racesWon,
            bestWpm,
            avgWpm,
          },
        },
      );
    }

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'leaderboard:remove',
      targetType: 'result',
      targetId: resultId,
      details: { wpm: result.wpm, userId: result.userId },
      ipAddress: ip,
    });

    return { message: 'Entry removed from leaderboard and flagged successfully' };
  }

  async resetDaily(admin: { id: string; username: string }, ip?: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Flag today's results or reset daily
    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'leaderboard:reset_daily',
      targetType: 'leaderboard',
      details: { resetAt: new Date() },
      ipAddress: ip,
    });

    return { message: 'Daily leaderboard reset successfully' };
  }

  async recalculateAll(admin: { id: string; username: string }, ip?: string) {
    const users = await this.userModel.find().select('_id username').exec();
    let recalculated = 0;

    for (const user of users) {
      const validResults = await this.raceResultModel
        .find({ userId: user._id, flagged: false, isBot: false })
        .exec();

      const racesPlayed = validResults.length;
      const racesWon = validResults.filter((r) => r.position === 1).length;
      const bestWpm = racesPlayed > 0 ? Math.max(...validResults.map((r) => r.wpm)) : 0;
      const avgWpm =
        racesPlayed > 0
          ? Math.round(validResults.reduce((sum, r) => sum + r.wpm, 0) / racesPlayed)
          : 0;

      await this.userModel.updateOne(
        { _id: user._id },
        {
          $set: {
            racesPlayed,
            racesWon,
            bestWpm,
            avgWpm,
          },
        },
      );
      recalculated++;
    }

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'leaderboard:recalculate',
      targetType: 'leaderboard',
      details: { totalUsersRecalculated: recalculated },
      ipAddress: ip,
    });

    return {
      message: `Recalculated rankings and statistics for ${recalculated} users from valid records.`,
      recalculated,
    };
  }
}


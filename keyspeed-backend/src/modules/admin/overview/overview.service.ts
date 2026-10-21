import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Race, RaceDocument } from '../../races/schemas/race.schema';
import { RaceResult, RaceResultDocument } from '../../races/schemas/race-result.schema';
import { AuditService } from '../audit/audit.service';
import { RoomService } from '../../realtime/room.service';

@Injectable()
export class OverviewService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Race.name) private raceModel: Model<RaceDocument>,
    @InjectModel(RaceResult.name) private raceResultModel: Model<RaceResultDocument>,
    private readonly auditService: AuditService,
    private readonly roomService: RoomService,
  ) {}

  async getOverview() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const activeRooms = this.roomService.getAllRooms().filter((r) => r.status !== 'finished');
    let onlineUsersCount = 0;
    const seenUserIds = new Set<string>();

    for (const room of activeRooms) {
      for (const [, player] of room.players) {
        if (!player.isBot && player.userId) {
          seenUserIds.add(player.userId);
        }
      }
    }
    onlineUsersCount = seenUserIds.size;

    const [
      totalUsers,
      newUsersToday,
      activeUsersLast24h,
      totalRaces,
      racesToday,
      flaggedPending,
      bannedUsers,
      latestUsers,
      latestFlagged,
      latestActions,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ createdAt: { $gte: startOfDay } }).exec(),
      this.userModel.countDocuments({ lastLoginAt: { $gte: twentyFourHoursAgo } }).exec(),
      this.raceModel.countDocuments().exec(),
      this.raceModel.countDocuments({ startedAt: { $gte: startOfDay } }).exec(),
      this.raceResultModel.countDocuments({ flagged: true, reviewStatus: 'pending' }).exec(),
      this.userModel.countDocuments({ isBanned: true }).exec(),
      this.userModel
        .find()
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .limit(5)
        .exec(),
      this.raceResultModel
        .find({ flagged: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'username email avgWpm')
        .exec(),
      this.auditService.getRecent(5),
    ]);

    return {
      stats: {
        totalUsers,
        newUsersToday,
        activeUsersLast24h,
        totalRaces,
        racesToday,
        flaggedPending,
        bannedUsers,
        onlineUsersNow: onlineUsersCount,
        activeRoomsNow: activeRooms.length,
      },
      latestUsers,
      latestFlagged,
      latestActions,
    };
  }

  async getCharts(days = 30) {
    const rangeDays = [7, 30, 90].includes(Number(days)) ? Number(days) : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - rangeDays);
    startDate.setHours(0, 0, 0, 0);

    // Aggregate signups per day
    const signupsAgg = await this.userModel.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Aggregate races per day
    const racesAgg = await this.raceModel.aggregate([
      { $match: { startedAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$startedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Aggregate average WPM trend per day
    const wpmAgg = await this.raceResultModel.aggregate([
      { $match: { createdAt: { $gte: startDate }, flagged: false, isBot: false } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          avgWpm: { $avg: '$wpm' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Race mode split
    const modeAgg = await this.raceModel.aggregate([
      { $match: { startedAt: { $gte: startDate } } },
      {
        $group: {
          _id: '$mode',
          count: { $sum: 1 },
        },
      },
    ]);

    // Build continuous date array for smooth charting
    const datesMap: Record<
      string,
      { date: string; signups: number; races: number; avgWpm: number }
    > = {};

    for (let i = 0; i <= rangeDays; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      datesMap[key] = { date: key, signups: 0, races: 0, avgWpm: 0 };
    }

    for (const item of signupsAgg) {
      if (datesMap[item._id]) datesMap[item._id].signups = item.count;
    }
    for (const item of racesAgg) {
      if (datesMap[item._id]) datesMap[item._id].races = item.count;
    }
    for (const item of wpmAgg) {
      if (datesMap[item._id]) datesMap[item._id].avgWpm = Math.round(item.avgWpm);
    }

    const modeSplit = { solo: 0, live: 0 };
    for (const m of modeAgg) {
      if (m._id === 'solo') modeSplit.solo = m.count;
      else modeSplit.live += m.count;
    }

    return {
      range: rangeDays,
      trends: Object.values(datesMap),
      modeSplit,
    };
  }
}


import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Race, RaceDocument } from '../../races/schemas/race.schema';
import { RaceResult, RaceResultDocument } from '../../races/schemas/race-result.schema';
import { Text, TextDocument } from '../../texts/schemas/text.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { AuditService } from '../audit/audit.service';

export interface AdminRacesQuery {
  page?: number;
  limit?: number;
  mode?: string;
  gameId?: string;
  startDate?: string;
  endDate?: string;
  isPrivate?: string;
  hasBots?: string;
  hasFlagged?: string;
}

@Injectable()
export class AdminRacesService {
  constructor(
    @InjectModel(Race.name) private raceModel: Model<RaceDocument>,
    @InjectModel(RaceResult.name) private raceResultModel: Model<RaceResultDocument>,
    @InjectModel(Text.name) private textModel: Model<TextDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: AdminRacesQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.mode && query.mode !== 'all') {
      filter.mode = query.mode;
    }

    if (query.gameId && query.gameId !== 'all') {
      if (query.gameId === 'classic-race') {
        filter.$or = [{ gameId: 'classic-race' }, { gameId: { $exists: false } }];
      } else {
        filter.gameId = query.gameId;
      }
    }

    if (query.isPrivate !== undefined && query.isPrivate !== 'all') {
      filter.isPrivate = query.isPrivate === 'true';
    }

    if (query.startDate || query.endDate) {
      filter.startedAt = {};
      if (query.startDate) {
        filter.startedAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.startedAt.$lte = new Date(query.endDate);
      }
    }

    if (query.hasFlagged === 'true') {
      const flaggedRaceIds = await this.raceResultModel
        .distinct('raceId', { flagged: true })
        .exec();
      filter._id = { $in: flaggedRaceIds };
    }

    if (query.hasBots === 'true') {
      const botRaceIds = await this.raceResultModel
        .distinct('raceId', { isBot: true })
        .exec();
      filter._id = { $in: botRaceIds };
    }

    const [races, total] = await Promise.all([
      this.raceModel
        .find(filter)
        .sort({ startedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('textId', 'content difficulty wordCount')
        .populate('playerIds', 'username')
        .exec(),
      this.raceModel.countDocuments(filter).exec(),
    ]);

    // Enhance each race with winner and results count
    const raceIds = races.map((r) => r._id);
    const results = await this.raceResultModel
      .find({ raceId: { $in: raceIds } })
      .populate('userId', 'username')
      .exec();

    const resultsByRace: Record<string, RaceResultDocument[]> = {};
    for (const res of results) {
      const rid = res.raceId.toString();
      if (!resultsByRace[rid]) resultsByRace[rid] = [];
      resultsByRace[rid].push(res);
    }

    const data = races.map((race) => {
      const raceResults = resultsByRace[race._id.toString()] || [];
      const winner = raceResults.find((r) => r.position === 1);
      const hasFlagged = raceResults.some((r) => r.flagged);
      const hasBots = raceResults.some((r) => r.isBot);
      const durationSeconds =
        race.endedAt && race.startedAt
          ? Math.max(0, Math.round((new Date(race.endedAt).getTime() - new Date(race.startedAt).getTime()) / 1000))
          : null;

      return {
        id: race._id,
        _id: race._id,
        mode: race.mode,
        isPrivate: race.isPrivate,
        roomCode: race.roomCode,
        startedAt: race.startedAt,
        endedAt: race.endedAt,
        durationSeconds,
        text: race.textId,
        playersCount: raceResults.length || race.playerIds.length,
        winner: winner
          ? {
              username: (winner.userId as any)?.username || (winner.isBot ? 'Bot' : 'Guest'),
              wpm: winner.wpm,
              accuracy: winner.accuracy,
            }
          : null,
        hasFlagged,
        hasBots,
      };
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid race ID');
    }

    const race = await this.raceModel
      .findById(id)
      .populate('textId')
      .populate('playerIds', 'username email')
      .exec();

    if (!race) {
      throw new NotFoundException(`Race ${id} not found`);
    }

    const results = await this.raceResultModel
      .find({ raceId: id })
      .sort({ position: 1 })
      .populate('userId', 'username email avgWpm')
      .populate('reviewedBy', 'username')
      .exec();

    return {
      race,
      results,
    };
  }

  async deleteRace(id: string, admin: { id: string; username: string }, ip?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid race ID');
    }

    const race = await this.raceModel.findById(id).exec();
    if (!race) {
      throw new NotFoundException(`Race ${id} not found`);
    }

    // Find affected results and affected users
    const results = await this.raceResultModel.find({ raceId: id }).exec();
    const affectedUserIds = [
      ...new Set(results.filter((r) => r.userId && !r.isBot).map((r) => r.userId.toString())),
    ];

    // Delete all results for this race
    await this.raceResultModel.deleteMany({ raceId: id }).exec();

    // Delete race
    await this.raceModel.findByIdAndDelete(id).exec();

    // Recalculate affected users' stats
    for (const userId of affectedUserIds) {
      const remainingResults = await this.raceResultModel
        .find({ userId, flagged: false, isBot: false })
        .exec();

      const racesPlayed = remainingResults.length;
      const racesWon = remainingResults.filter((r) => r.position === 1).length;
      const bestWpm = racesPlayed > 0 ? Math.max(...remainingResults.map((r) => r.wpm)) : 0;
      const avgWpm =
        racesPlayed > 0
          ? Math.round(remainingResults.reduce((sum, r) => sum + r.wpm, 0) / racesPlayed)
          : 0;

      await this.userModel.updateOne(
        { _id: userId },
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
      action: 'race:delete',
      targetType: 'race',
      targetId: id,
      details: {
        mode: race.mode,
        startedAt: race.startedAt,
        affectedUsersCount: affectedUserIds.length,
      },
      ipAddress: ip,
    });

    return {
      message: `Race ${id} deleted successfully. Recalculated stats for ${affectedUserIds.length} users.`,
    };
  }
}


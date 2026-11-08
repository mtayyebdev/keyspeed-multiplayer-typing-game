import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RaceResult, RaceResultDocument } from '../../races/schemas/race-result.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { AuditService } from '../audit/audit.service';
import { AdminUsersService } from '../users/admin-users.service';

@Injectable()
export class AdminFlaggedService {
  constructor(
    @InjectModel(RaceResult.name) private raceResultModel: Model<RaceResultDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly auditService: AuditService,
    private readonly adminUsersService: AdminUsersService,
  ) {}

  async findAll(query: { page?: number; limit?: number; status?: string; gameId?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: any = { flagged: true };
    if (query.status && query.status !== 'all') {
      filter.reviewStatus = query.status;
    }
    if (query.gameId && query.gameId !== 'all') {
      if (query.gameId === 'classic-race') {
        filter.$or = [{ gameId: 'classic-race' }, { gameId: { $exists: false } }];
      } else {
        filter.gameId = query.gameId;
      }
    }

    const [results, total] = await Promise.all([
      this.raceResultModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email avgWpm bestWpm isBanned')
        .populate('raceId', 'mode startedAt')
        .populate('reviewedBy', 'username')
        .exec(),
      this.raceResultModel.countDocuments(filter).exec(),
    ]);

    return {
      data: results,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approveResult(
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

    result.flagged = false;
    result.reviewStatus = 'approved';
    result.reviewedBy = admin.id;
    result.reviewedAt = new Date();

    const saved = await result.save();

    // Recalculate user stats to include approved run if non-bot
    if (result.userId && !result.isBot) {
      const allValid = await this.raceResultModel
        .find({ userId: result.userId, flagged: false, isBot: false })
        .exec();

      const racesPlayed = allValid.length;
      const racesWon = allValid.filter((r) => r.position === 1).length;
      const bestWpm = racesPlayed > 0 ? Math.max(...allValid.map((r) => r.wpm)) : 0;
      const avgWpm =
        racesPlayed > 0
          ? Math.round(allValid.reduce((sum, r) => sum + r.wpm, 0) / racesPlayed)
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
      action: 'flagged:approve',
      targetType: 'result',
      targetId: resultId,
      details: { wpm: result.wpm, accuracy: result.accuracy, userId: result.userId },
      ipAddress: ip,
    });

    return saved;
  }

  async rejectResult(
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

    const saved = await result.save();

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'flagged:reject',
      targetType: 'result',
      targetId: resultId,
      details: { wpm: result.wpm, userId: result.userId },
      ipAddress: ip,
    });

    return saved;
  }

  async rejectAndBan(
    resultId: string,
    reason: string,
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

    if (result.userId && !result.isBot) {
      const banReason = reason || `Anti-cheat violation on result ${resultId} (${result.wpm} WPM)`;
      await this.adminUsersService.banUser(result.userId.toString(), banReason, admin, ip);
    }

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'flagged:reject_and_ban',
      targetType: 'result',
      targetId: resultId,
      details: { wpm: result.wpm, userId: result.userId, reason },
      ipAddress: ip,
    });

    return { message: 'Result rejected and racer banned successfully' };
  }
}


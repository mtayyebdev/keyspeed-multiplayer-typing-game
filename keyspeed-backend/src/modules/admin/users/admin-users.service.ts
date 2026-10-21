import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { RaceResult, RaceResultDocument } from '../../races/schemas/race-result.schema';
import { AuditLog, AuditLogDocument } from '../audit/audit.schema';
import { AuditService } from '../audit/audit.service';

export interface AdminUserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RaceResult.name) private raceResultModel: Model<RaceResultDocument>,
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
    private readonly auditService: AuditService,
  ) {}

  private escapeRegex(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async findAll(query: AdminUserQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.search && query.search.trim()) {
      const safeSearch = this.escapeRegex(query.search.trim());
      filter.$or = [
        { username: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    if (query.role && query.role !== 'all') {
      filter.role = query.role;
    }

    if (query.status && query.status !== 'all') {
      if (query.status === 'banned') {
        filter.isBanned = true;
      } else if (query.status === 'active') {
        filter.isBanned = false;
      }
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.createdAt.$lte = new Date(query.endDate);
      }
    }

    const sortField = query.sortField || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: any = { [sortField]: sortOrder };

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-passwordHash')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      data: users.map((u) => ({
        id: u._id,
        _id: u._id,
        username: u.username,
        email: u.email,
        role: u.role || 'user',
        isBanned: u.isBanned || false,
        bannedReason: u.bannedReason,
        bannedAt: u.bannedAt,
        status: u.isBanned ? 'banned' : 'active',
        bestWpm: u.bestWpm || 0,
        avgWpm: u.avgWpm || 0,
        racesPlayed: u.racesPlayed || 0,
        racesWon: u.racesWon || 0,
        tokenVersion: u.tokenVersion || 0,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      })),
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
      throw new BadRequestException('Invalid user ID');
    }

    const user = await this.userModel.findById(id).select('-passwordHash').exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    // Last 20 race results
    const last20Results = await this.raceResultModel
      .find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('raceId', 'mode startedAt isPrivate')
      .exec();

    // Flagged history
    const flaggedHistory = await this.raceResultModel
      .find({ userId: id, flagged: true })
      .sort({ createdAt: -1 })
      .populate('raceId', 'mode startedAt')
      .exec();

    // Ban / action history from audit logs
    const banHistory = await this.auditModel
      .find({
        targetType: 'user',
        targetId: id,
        action: { $in: ['user:ban', 'user:unban', 'user:role_change', 'user:force_logout'] },
      })
      .sort({ createdAt: -1 })
      .exec();

    return {
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        isBanned: user.isBanned || false,
        bannedReason: user.bannedReason,
        bannedAt: user.bannedAt,
        status: user.isBanned ? 'banned' : 'active',
        bestWpm: user.bestWpm || 0,
        avgWpm: user.avgWpm || 0,
        racesPlayed: user.racesPlayed || 0,
        racesWon: user.racesWon || 0,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
      last20Results,
      flaggedHistory,
      banHistory,
    };
  }

  async updateUser(
    id: string,
    dto: { username?: string; email?: string },
    admin: { id: string; username: string },
    ip?: string,
  ) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    if (dto.username && dto.username.trim() !== user.username) {
      const existing = await this.userModel.findOne({
        username: dto.username.trim(),
        _id: { $ne: user._id },
      });
      if (existing) {
        throw new ConflictException('Username is already taken');
      }
      user.username = dto.username.trim();
    }

    if (dto.email && dto.email.toLowerCase().trim() !== user.email) {
      const existing = await this.userModel.findOne({
        email: dto.email.toLowerCase().trim(),
        _id: { $ne: user._id },
      });
      if (existing) {
        throw new ConflictException('Email address is already in use');
      }
      user.email = dto.email.toLowerCase().trim();
    }

    const saved = await user.save();

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'user:edit',
      targetType: 'user',
      targetId: id,
      details: { username: saved.username, email: saved.email },
      ipAddress: ip,
    });

    return saved;
  }

  async changeRole(
    id: string,
    newRole: 'user' | 'admin',
    admin: { id: string; username: string },
    ip?: string,
  ) {
    if (admin.id === id && newRole !== 'admin') {
      throw new ForbiddenException('Safety rule: An admin cannot demote themselves');
    }

    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    if (user.role === 'admin' && newRole === 'user') {
      const adminCount = await this.userModel.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        throw new ForbiddenException('Safety rule: The last remaining admin cannot be demoted');
      }
    }

    const previousRole = user.role;
    user.role = newRole;
    const saved = await user.save();

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'user:role_change',
      targetType: 'user',
      targetId: id,
      details: { previousRole, newRole, targetUsername: user.username },
      ipAddress: ip,
    });

    return saved;
  }

  async banUser(
    id: string,
    reason: string,
    admin: { id: string; username: string },
    ip?: string,
  ) {
    if (admin.id === id) {
      throw new ForbiddenException('Safety rule: An admin cannot ban themselves');
    }

    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    if (user.role === 'admin') {
      const adminCount = await this.userModel.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        throw new ForbiddenException('Safety rule: The last remaining admin cannot be banned');
      }
    }

    user.isBanned = true;
    user.bannedReason = reason || 'Banned by administrator';
    user.bannedAt = new Date();
    user.tokenVersion = (user.tokenVersion || 0) + 1; // Invalidate all active tokens

    const saved = await user.save();

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'user:ban',
      targetType: 'user',
      targetId: id,
      details: { reason: user.bannedReason, targetUsername: user.username },
      ipAddress: ip,
    });

    return saved;
  }

  async unbanUser(
    id: string,
    admin: { id: string; username: string },
    ip?: string,
  ) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    user.isBanned = false;
    user.bannedReason = null as any;
    user.bannedAt = null as any;

    const saved = await user.save();

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'user:unban',
      targetType: 'user',
      targetId: id,
      details: { targetUsername: user.username },
      ipAddress: ip,
    });

    return saved;
  }

  async resetStats(
    id: string,
    admin: { id: string; username: string },
    ip?: string,
  ) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const previousStats = {
      avgWpm: user.avgWpm,
      bestWpm: user.bestWpm,
      racesPlayed: user.racesPlayed,
      racesWon: user.racesWon,
    };

    user.avgWpm = 0;
    user.bestWpm = 0;
    user.racesPlayed = 0;
    user.racesWon = 0;

    const saved = await user.save();

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'user:reset_stats',
      targetType: 'user',
      targetId: id,
      details: { previousStats, targetUsername: user.username },
      ipAddress: ip,
    });

    return saved;
  }

  async forceLogout(
    id: string,
    admin: { id: string; username: string },
    ip?: string,
  ) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'user:force_logout',
      targetType: 'user',
      targetId: id,
      details: { tokenVersion: user.tokenVersion, targetUsername: user.username },
      ipAddress: ip,
    });

    return { message: 'User session invalidated successfully' };
  }

  async deleteUser(
    id: string,
    admin: { id: string; username: string },
    ip?: string,
  ) {
    if (admin.id === id) {
      throw new ForbiddenException('Safety rule: An admin cannot delete themselves');
    }

    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    if (user.role === 'admin') {
      const adminCount = await this.userModel.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        throw new ForbiddenException('Safety rule: The last remaining admin cannot be deleted');
      }
    }

    // Delete user race results
    await this.raceResultModel.deleteMany({ userId: id }).exec();

    // Delete user record
    await this.userModel.findByIdAndDelete(id).exec();

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'user:delete',
      targetType: 'user',
      targetId: id,
      details: { deletedUsername: user.username, deletedEmail: user.email },
      ipAddress: ip,
    });

    return { message: `User @${user.username} deleted successfully` };
  }

  async bulkAction(
    dto: { userIds: string[]; action: 'ban' | 'unban' | 'delete'; reason?: string },
    admin: { id: string; username: string },
    ip?: string,
  ) {
    const { userIds, action, reason } = dto;
    if (!userIds || !userIds.length) {
      throw new BadRequestException('No users selected');
    }

    let processed = 0;
    const errors: string[] = [];

    for (const id of userIds) {
      try {
        if (action === 'ban') {
          await this.banUser(id, reason || 'Bulk ban action', admin, ip);
          processed++;
        } else if (action === 'unban') {
          await this.unbanUser(id, admin, ip);
          processed++;
        } else if (action === 'delete') {
          await this.deleteUser(id, admin, ip);
          processed++;
        }
      } catch (err: any) {
        errors.push(`User ${id}: ${err.message}`);
      }
    }

    return {
      message: `Successfully processed ${processed} of ${userIds.length} users.`,
      processed,
      errors,
    };
  }

  async exportUsers(query: AdminUserQuery) {
    const filter: any = {};
    if (query.role && query.role !== 'all') filter.role = query.role;
    if (query.status && query.status !== 'all') {
      filter.isBanned = query.status === 'banned';
    }

    const users = await this.userModel
      .find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .exec();

    return users.map((u) => ({
      ID: u._id.toString(),
      Username: u.username,
      Email: u.email,
      Role: u.role || 'user',
      Status: u.isBanned ? 'Banned' : 'Active',
      BestWPM: u.bestWpm || 0,
      AvgWPM: u.avgWpm || 0,
      RacesPlayed: u.racesPlayed || 0,
      RacesWon: u.racesWon || 0,
      BannedReason: u.bannedReason || '',
      JoinedDate: u.createdAt ? u.createdAt.toISOString() : '',
      LastLogin: u.lastLoginAt ? u.lastLoginAt.toISOString() : '',
    }));
  }
}


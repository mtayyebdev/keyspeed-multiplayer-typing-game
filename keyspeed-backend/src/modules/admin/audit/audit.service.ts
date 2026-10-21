import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from './audit.schema';

export interface CreateAuditEntry {
  adminId: string;
  adminUsername: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name) private auditModel: Model<AuditLogDocument>,
  ) {}

  async log(entry: CreateAuditEntry): Promise<AuditLogDocument> {
    try {
      const created = new this.auditModel(entry);
      return await created.save();
    } catch (err: any) {
      this.logger.error(`Failed to write audit log: ${err.message}`, err.stack);
      // We don't want audit logging failure to crash primary business operations
      return null as any;
    }
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
    targetType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.adminId) {
      filter.adminId = query.adminId;
    }
    if (query.action) {
      filter.action = query.action;
    }
    if (query.targetType) {
      filter.targetType = query.targetType;
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

    const [data, total] = await Promise.all([
      this.auditModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.auditModel.countDocuments(filter).exec(),
    ]);

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

  async getRecent(limit = 5): Promise<AuditLogDocument[]> {
    return this.auditModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }
}


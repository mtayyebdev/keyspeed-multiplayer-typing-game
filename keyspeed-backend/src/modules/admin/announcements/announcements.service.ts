import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Announcement, AnnouncementDocument } from './announcement.schema';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectModel(Announcement.name)
    private announcementModel: Model<AnnouncementDocument>,
    private readonly auditService: AuditService,
  ) {}

  async getActive() {
    const now = new Date();
    const filter = {
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: null },
            { startDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: now } },
          ],
        },
      ],
    };

    return this.announcementModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findAll(query: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.announcementModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.announcementModel.countDocuments().exec(),
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

  async create(dto: any, admin: { id: string; username: string }, ip?: string) {
    const created = new this.announcementModel({
      message: dto.message,
      type: dto.type || 'info',
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
    });

    const saved = await created.save();

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'announcement:create',
      targetType: 'announcement',
      targetId: saved._id.toString(),
      details: { message: saved.message, type: saved.type },
      ipAddress: ip,
    });

    return saved;
  }

  async update(id: string, dto: any, admin: { id: string; username: string }, ip?: string) {
    const doc = await this.announcementModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`Announcement ${id} not found`);
    }

    if (dto.message !== undefined) doc.message = dto.message;
    if (dto.type !== undefined) doc.type = dto.type;
    if (dto.isActive !== undefined) doc.isActive = dto.isActive;
    if (dto.startDate !== undefined) doc.startDate = dto.startDate ? new Date(dto.startDate) : null as any;
    if (dto.endDate !== undefined) doc.endDate = dto.endDate ? new Date(dto.endDate) : null as any;

    const saved = await doc.save();

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'announcement:update',
      targetType: 'announcement',
      targetId: saved._id.toString(),
      details: { updatedFields: Object.keys(dto) },
      ipAddress: ip,
    });

    return saved;
  }

  async delete(id: string, admin: { id: string; username: string }, ip?: string) {
    const doc = await this.announcementModel.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`Announcement ${id} not found`);
    }

    await this.announcementModel.findByIdAndDelete(id).exec();

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'announcement:delete',
      targetType: 'announcement',
      targetId: id,
      details: { deletedMessage: doc.message },
      ipAddress: ip,
    });

    return { message: 'Announcement deleted successfully' };
  }
}


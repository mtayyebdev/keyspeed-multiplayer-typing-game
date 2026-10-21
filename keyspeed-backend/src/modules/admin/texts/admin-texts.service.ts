import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Text, TextDocument } from '../../texts/schemas/text.schema';
import { Race, RaceDocument } from '../../races/schemas/race.schema';
import { RaceResult, RaceResultDocument } from '../../races/schemas/race-result.schema';
import { AuditService } from '../audit/audit.service';

export interface AdminTextsQuery {
  page?: number;
  limit?: number;
  search?: string;
  difficulty?: string;
  language?: string;
  status?: string; // active | inactive | all
}

@Injectable()
export class AdminTextsService {
  constructor(
    @InjectModel(Text.name) private textModel: Model<TextDocument>,
    @InjectModel(Race.name) private raceModel: Model<RaceDocument>,
    @InjectModel(RaceResult.name) private raceResultModel: Model<RaceResultDocument>,
    private readonly auditService: AuditService,
  ) {}

  private escapeRegex(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async findAll(query: AdminTextsQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.search && query.search.trim()) {
      filter.content = { $regex: this.escapeRegex(query.search.trim()), $options: 'i' };
    }

    if (query.difficulty && query.difficulty !== 'all') {
      filter.difficulty = query.difficulty.toLowerCase().trim();
    }

    if (query.language && query.language !== 'all') {
      filter.language = query.language.toLowerCase().trim();
    }

    if (query.status && query.status !== 'all') {
      filter.isActive = query.status === 'active';
    }

    const [texts, total] = await Promise.all([
      this.textModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.textModel.countDocuments(filter).exec(),
    ]);

    // Enhance texts with average WPM from race results
    const textIds = texts.map((t) => t._id);
    const races = await this.raceModel.find({ textId: { $in: textIds } }).select('_id textId').exec();
    const raceIdToTextId: Record<string, string> = {};
    const raceIds = races.map((r) => {
      raceIdToTextId[r._id.toString()] = r.textId.toString();
      return r._id;
    });

    const results = await this.raceResultModel
      .find({ raceId: { $in: raceIds }, flagged: false, isBot: false })
      .select('raceId wpm')
      .exec();

    const wpmStatsByText: Record<string, { sum: number; count: number }> = {};
    for (const res of results) {
      const textId = raceIdToTextId[res.raceId.toString()];
      if (textId) {
        if (!wpmStatsByText[textId]) wpmStatsByText[textId] = { sum: 0, count: 0 };
        wpmStatsByText[textId].sum += res.wpm;
        wpmStatsByText[textId].count += 1;
      }
    }

    const data = texts.map((t) => {
      const stats = wpmStatsByText[t._id.toString()];
      const avgWpm = stats && stats.count > 0 ? Math.round(stats.sum / stats.count) : null;

      return {
        id: t._id,
        _id: t._id,
        content: t.content,
        difficulty: t.difficulty,
        language: t.language || 'en',
        wordCount: t.wordCount,
        charCount: t.content.length,
        isActive: t.isActive !== false,
        usageCount: t.usageCount || 0,
        avgWpm,
        createdAt: t.createdAt,
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

  async create(
    dto: { content: string; difficulty?: string; language?: string; isActive?: boolean },
    admin: { id: string; username: string },
    ip?: string,
  ) {
    if (!dto.content || !dto.content.trim()) {
      throw new BadRequestException('Content is required');
    }

    const trimmed = dto.content.trim();
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

    const newText = new this.textModel({
      content: trimmed,
      difficulty: (dto.difficulty || 'normal').toLowerCase().trim(),
      language: (dto.language || 'en').toLowerCase().trim(),
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      wordCount,
      usageCount: 0,
    });

    const saved = await newText.save();

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'text:create',
      targetType: 'text',
      targetId: saved._id.toString(),
      details: { wordCount, difficulty: saved.difficulty },
      ipAddress: ip,
    });

    return saved;
  }

  async update(
    id: string,
    dto: { content?: string; difficulty?: string; language?: string; isActive?: boolean },
    admin: { id: string; username: string },
    ip?: string,
  ) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid text ID');
    }

    const text = await this.textModel.findById(id).exec();
    if (!text) {
      throw new NotFoundException(`Text ${id} not found`);
    }

    if (dto.content !== undefined) {
      const trimmed = dto.content.trim();
      text.content = trimmed;
      text.wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    }
    if (dto.difficulty !== undefined) {
      text.difficulty = dto.difficulty.toLowerCase().trim();
    }
    if (dto.language !== undefined) {
      text.language = dto.language.toLowerCase().trim();
    }
    if (dto.isActive !== undefined) {
      text.isActive = dto.isActive;
    }

    const saved = await text.save();

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'text:update',
      targetType: 'text',
      targetId: id,
      details: { updatedFields: Object.keys(dto) },
      ipAddress: ip,
    });

    return saved;
  }

  async delete(id: string, admin: { id: string; username: string }, ip?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid text ID');
    }

    const text = await this.textModel.findById(id).exec();
    if (!text) {
      throw new NotFoundException(`Text ${id} not found`);
    }

    await this.textModel.findByIdAndDelete(id).exec();

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'text:delete',
      targetType: 'text',
      targetId: id,
      details: { wordCount: text.wordCount, difficulty: text.difficulty },
      ipAddress: ip,
    });

    return { message: 'Text deleted successfully' };
  }

  async importTexts(
    items: Array<{ content: string; difficulty?: string; language?: string }>,
    admin: { id: string; username: string },
    ip?: string,
  ) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Input must be a non-empty array of items');
    }

    const validDocs = [];
    const errors: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.content || typeof item.content !== 'string' || !item.content.trim()) {
        errors.push(`Row ${i + 1}: missing content`);
        continue;
      }

      const content = item.content.trim();
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      if (wordCount < 5) {
        errors.push(`Row ${i + 1}: text too short (minimum 5 words)`);
        continue;
      }

      validDocs.push({
        content,
        difficulty: (item.difficulty || 'normal').toLowerCase().trim(),
        language: (item.language || 'en').toLowerCase().trim(),
        wordCount,
        isActive: true,
        usageCount: 0,
      });
    }

    let insertedCount = 0;
    if (validDocs.length > 0) {
      const res = await this.textModel.insertMany(validDocs);
      insertedCount = res.length;
    }

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'text:import',
      targetType: 'text',
      details: { insertedCount, errorsCount: errors.length },
      ipAddress: ip,
    });

    return {
      message: `Successfully imported ${insertedCount} texts`,
      insertedCount,
      errors,
    };
  }
}


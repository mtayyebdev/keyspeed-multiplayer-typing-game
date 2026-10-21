import { Injectable, OnModuleInit, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Text, TextDocument } from './schemas/text.schema';
import { SEED_TEXTS } from './seeds/texts.seed';

@Injectable()
export class TextsService implements OnModuleInit {
  private readonly logger = new Logger(TextsService.name);

  constructor(@InjectModel(Text.name) private textModel: Model<TextDocument>) {}

  async onModuleInit() {
    await this.seedTextsIfEmpty();
  }

  async seedTextsIfEmpty() {
    try {
      const count = await this.textModel.countDocuments();
      if (count === 0) {
        this.logger.log(`Seeding initial ${SEED_TEXTS.length} texts into database...`);
        await this.textModel.insertMany(SEED_TEXTS);
        this.logger.log('Texts seed completed successfully.');
      }
    } catch (err:any) {
      this.logger.warn(`Could not seed texts on startup: ${err.message}`);
    }
  }

  async getRandomText(difficulty?: string, length?: string): Promise<TextDocument> {
    const count = await this.textModel.countDocuments();
    if (count === 0) {
      // If for any reason DB is empty, insert seeds
      await this.seedTextsIfEmpty();
    }

    const filter: any = { isActive: true };
    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty.toLowerCase().trim();
    }

    if (length) {
      const len = length.toLowerCase().trim();
      if (len === 'short') {
        filter.wordCount = { $lte: 30 };
      } else if (len === 'medium') {
        filter.wordCount = { $gt: 30, $lte: 35 };
      } else if (len === 'long') {
        filter.wordCount = { $gt: 35 };
      }
    }

    const total = await this.textModel.countDocuments(filter);
    if (total === 0) {
      // Fallback to any active text
      const fallbackTotal = await this.textModel.countDocuments({ isActive: true });
      const randomIndex = Math.floor(Math.random() * (fallbackTotal || 1));
      const fallbackText = await this.textModel.findOne({ isActive: true }).skip(randomIndex).exec();
      if (fallbackText) {
        await this.textModel.updateOne({ _id: fallbackText._id }, { $inc: { usageCount: 1 } });
        return fallbackText;
      }
      return this.textModel.findOne().exec();
    }

    const randomIndex = Math.floor(Math.random() * total);
    const text = await this.textModel.findOne(filter).skip(randomIndex).exec();
    if (text) {
      await this.textModel.updateOne({ _id: text._id }, { $inc: { usageCount: 1 } });
    }
    return text || this.textModel.findOne().exec();
  }

  async findById(id: string): Promise<TextDocument> {
    const text = await this.textModel.findById(id).exec();
    if (!text) {
      throw new NotFoundException(`Text with id ${id} not found`);
    }
    return text;
  }
}


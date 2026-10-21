import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TextsService } from '../texts/texts.service';
import { UsersService } from '../users/users.service';
import { Race, RaceDocument } from '../races/schemas/race.schema';
import { RaceResult, RaceResultDocument } from '../races/schemas/race-result.schema';
import { SoloSubmitDto } from './dto/solo-submit.dto';
import { calculateWpm, calculateAccuracy } from '../../games/wpm.util';
import { evaluateRunAntiCheat } from '../../games/anti-cheat.util';
import { SettingsService } from '../admin/settings/settings.service';

@Injectable()
export class SoloService {
  constructor(
    private readonly textsService: TextsService,
    private readonly usersService: UsersService,
    private readonly settingsService: SettingsService,
    @InjectModel(Race.name) private raceModel: Model<RaceDocument>,
    @InjectModel(RaceResult.name) private raceResultModel: Model<RaceResultDocument>,
  ) {}

  async submitSolo(submitDto: SoloSubmitDto, userId?: string) {
    const { textId, typedText, durationMs } = submitDto;

    const originalTextDoc = await this.textsService.findById(textId);
    if (!originalTextDoc) {
      throw new BadRequestException('Invalid text ID');
    }

    const originalContent = originalTextDoc.content;

    // Server-computed metrics
    const { accuracy, errors } = calculateAccuracy(originalContent, typedText);
    const wpm = calculateWpm(typedText.length, durationMs);

    // Anti-cheat verification with dynamic admin threshold
    const settings = this.settingsService.getSettings();
    const antiCheat = evaluateRunAntiCheat(wpm, accuracy, [], settings.maxAllowedWpm || 250);
    const flagged = antiCheat.isFlagged;

    // Create a solo race record
    const now = new Date();
    const startedAt = new Date(now.getTime() - durationMs);

    const race = new this.raceModel({
      mode: 'solo',
      textId: originalTextDoc._id,
      playerIds: userId ? [userId] : [],
      startedAt,
      endedAt: now,
      isPrivate: false,
    });
    const savedRace = await race.save();

    // Create RaceResult
    const raceResult = new this.raceResultModel({
      raceId: savedRace._id,
      userId: userId || null,
      isBot: false,
      position: 1,
      wpm,
      accuracy,
      errors,
      flagged,
      reviewStatus: flagged ? 'pending' : 'none',
      flaggedReason: flagged ? antiCheat.reason || 'Anti-cheat flag: high WPM or input anomaly' : null,
    });
    const savedResult = await raceResult.save();

    // Update user stats if registered and not flagged
    if (userId && !flagged) {
      await this.usersService.updateUserStats(userId, wpm, false);
    }

    return {
      resultId: savedResult._id,
      wpm,
      accuracy,
      errors,
      durationMs,
      flagged,
      reason: antiCheat.reason,
    };
  }
}


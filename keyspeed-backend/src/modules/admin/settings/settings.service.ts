import { Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Settings, SettingsDocument } from './settings.schema';
import { AuditService } from '../audit/audit.service';

export const DEFAULT_SETTINGS = {
  botWaitTime: 8,
  maxPlayersPerRace: 4,
  countdownSeconds: 3,
  raceTimeoutSeconds: 120,
  maxAllowedWpm: 250,
  maxProgressJumpPerTick: 15,
  botsEnabled: true,
  registrationEnabled: true,
  maintenanceMode: false,
  carRace: {
    stallPenaltyMs: 400,
    idleTimeoutMs: 1000,
  },
};

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);
  private cachedSettings: Settings;

  constructor(
    @InjectModel(Settings.name) private settingsModel: Model<SettingsDocument>,
    private readonly auditService: AuditService,
  ) {
    this.cachedSettings = { ...DEFAULT_SETTINGS } as any;
  }

  async onModuleInit() {
    await this.loadSettings();
  }

  async loadSettings(): Promise<Settings> {
    try {
      let doc = await this.settingsModel.findOne().exec();
      if (!doc) {
        doc = await this.settingsModel.create(DEFAULT_SETTINGS);
        this.logger.log('Initialized default game settings in database.');
      }
      this.cachedSettings = doc.toObject();
      if (!this.cachedSettings.carRace) {
        this.cachedSettings.carRace = { ...DEFAULT_SETTINGS.carRace };
      }
      return this.cachedSettings;
    } catch (err: any) {
      this.logger.error(`Error loading game settings: ${err.message}`);
      return this.cachedSettings;
    }
  }

  getSettings(): Settings {
    return this.cachedSettings || (DEFAULT_SETTINGS as any);
  }

  getPublicSettings() {
    const s = this.getSettings();
    return {
      registrationEnabled: s.registrationEnabled ?? true,
      maintenanceMode: s.maintenanceMode ?? false,
    };
  }

  async updateSettings(dto: Partial<Settings>, admin: { id: string; username: string }, ip?: string) {
    // Validate ranges
    if (dto.botWaitTime !== undefined && (dto.botWaitTime < 1 || dto.botWaitTime > 60)) {
      throw new BadRequestException('botWaitTime must be between 1 and 60 seconds');
    }
    if (dto.maxPlayersPerRace !== undefined && (dto.maxPlayersPerRace < 2 || dto.maxPlayersPerRace > 10)) {
      throw new BadRequestException('maxPlayersPerRace must be between 2 and 10');
    }
    if (dto.countdownSeconds !== undefined && (dto.countdownSeconds < 1 || dto.countdownSeconds > 10)) {
      throw new BadRequestException('countdownSeconds must be between 1 and 10');
    }
    if (dto.raceTimeoutSeconds !== undefined && (dto.raceTimeoutSeconds < 30 || dto.raceTimeoutSeconds > 600)) {
      throw new BadRequestException('raceTimeoutSeconds must be between 30 and 600');
    }
    if (dto.maxAllowedWpm !== undefined && (dto.maxAllowedWpm < 100 || dto.maxAllowedWpm > 400)) {
      throw new BadRequestException('maxAllowedWpm must be between 100 and 400');
    }
    if (dto.maxProgressJumpPerTick !== undefined && (dto.maxProgressJumpPerTick < 5 || dto.maxProgressJumpPerTick > 50)) {
      throw new BadRequestException('maxProgressJumpPerTick must be between 5 and 50');
    }
    if (dto.carRace?.stallPenaltyMs !== undefined && (dto.carRace.stallPenaltyMs < 100 || dto.carRace.stallPenaltyMs > 2000)) {
      throw new BadRequestException('carRace.stallPenaltyMs must be between 100 and 2000 ms');
    }
    if (dto.carRace?.idleTimeoutMs !== undefined && (dto.carRace.idleTimeoutMs < 200 || dto.carRace.idleTimeoutMs > 5000)) {
      throw new BadRequestException('carRace.idleTimeoutMs must be between 200 and 5000 ms');
    }

    let doc = await this.settingsModel.findOne().exec();
    if (!doc) {
      doc = new this.settingsModel(DEFAULT_SETTINGS);
    }

    const previous = doc.toObject();
    Object.assign(doc, dto);
    const updated = await doc.save();
    this.cachedSettings = updated.toObject();

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'settings:update',
      targetType: 'settings',
      targetId: updated._id.toString(),
      details: { previous, updated: this.cachedSettings },
      ipAddress: ip,
    });

    return this.cachedSettings;
  }

  async resetSettings(admin: { id: string; username: string }, ip?: string) {
    let doc = await this.settingsModel.findOne().exec();
    if (!doc) {
      doc = new this.settingsModel(DEFAULT_SETTINGS);
    } else {
      Object.assign(doc, DEFAULT_SETTINGS);
    }

    const updated = await doc.save();
    this.cachedSettings = updated.toObject();

    await this.auditService.log({
      adminId: admin.id,
      adminUsername: admin.username,
      action: 'settings:reset',
      targetType: 'settings',
      targetId: updated._id.toString(),
      details: { resetTo: DEFAULT_SETTINGS },
      ipAddress: ip,
    });

    return this.cachedSettings;
  }
}


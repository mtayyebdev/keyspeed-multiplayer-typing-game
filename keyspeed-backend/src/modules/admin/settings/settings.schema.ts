import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SettingsDocument = Settings & Document;

@Schema({ timestamps: true })
export class Settings {
  @Prop({ default: 8, min: 1, max: 60 })
  botWaitTime: number; // seconds before bots join

  @Prop({ default: 4, min: 2, max: 10 })
  maxPlayersPerRace: number;

  @Prop({ default: 3, min: 1, max: 10 })
  countdownSeconds: number;

  @Prop({ default: 120, min: 30, max: 600 })
  raceTimeoutSeconds: number;

  @Prop({ default: 250, min: 100, max: 400 })
  maxAllowedWpm: number;

  @Prop({ default: 15, min: 5, max: 50 })
  maxProgressJumpPerTick: number;

  @Prop({ default: true })
  botsEnabled: boolean;

  @Prop({ default: true })
  registrationEnabled: boolean;

  @Prop({ default: false })
  maintenanceMode: boolean;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);


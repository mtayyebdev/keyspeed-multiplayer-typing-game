import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class User {
  @Prop({ required: true, unique: true, index: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ type: String, enum: ['user', 'admin'], default: 'user', index: true })
  role: 'user' | 'admin';

  @Prop({ default: false, index: true })
  isBanned: boolean;

  @Prop({ default: null })
  bannedReason?: string;

  @Prop({ default: null })
  bannedAt?: Date;

  @Prop({ default: null })
  lastLoginAt?: Date;

  @Prop({ default: 0 })
  tokenVersion: number;

  @Prop({ default: 0 })
  avgWpm: number;

  @Prop({ default: 0 })
  bestWpm: number;

  @Prop({ default: 0 })
  racesPlayed: number;

  @Prop({ default: 0 })
  racesWon: number;

  createdAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Ensure sensitive fields are never exposed in JSON serialization
UserSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.passwordHash;
    delete ret.tokenVersion;
    delete ret.__v;
    return ret;
  },
});
UserSchema.set('toObject', {
  transform: (_doc, ret: any) => {
    delete ret.passwordHash;
    delete ret.tokenVersion;
    delete ret.__v;
    return ret;
  },
});



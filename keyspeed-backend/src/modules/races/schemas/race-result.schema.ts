import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type RaceResultDocument = RaceResult & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class RaceResult {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Race', required: true })
  raceId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  userId: string | null;

  @Prop({ default: false })
  isBot: boolean;

  @Prop({ required: true })
  position: number;

  @Prop({ required: true, index: true })
  wpm: number;

  @Prop({ required: true })
  accuracy: number;

  @Prop({ default: 0 })
  errors: number;

  @Prop({ default: false, index: true })
  flagged: boolean;

  @Prop({ default: null })
  flaggedReason?: string;

  @Prop({
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
    index: true,
  })
  reviewStatus: 'none' | 'pending' | 'approved' | 'rejected';

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', default: null })
  reviewedBy?: string;

  @Prop({ default: null })
  reviewedAt?: Date;

  @Prop({ default: 'classic-race', index: true })
  gameId: string;

  @Prop({ default: null })
  topSpeed?: number;

  @Prop({ default: null })
  avgSpeed?: number;

  @Prop({ default: null })
  stalls?: number;

  createdAt?: Date;
}

export const RaceResultSchema = SchemaFactory.createForClass(RaceResult);

// Compound index on userId and createdAt
RaceResultSchema.index({ userId: 1, createdAt: -1 });
RaceResultSchema.index({ flagged: 1, reviewStatus: 1 });
RaceResultSchema.index({ gameId: 1, wpm: -1 });
RaceResultSchema.index({ gameId: 1, userId: 1, createdAt: -1 });


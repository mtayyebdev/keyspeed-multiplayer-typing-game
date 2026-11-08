import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type RaceDocument = Race & Document;

@Schema({ timestamps: false })
export class Race {
  @Prop({ required: true, enum: ['solo', 'race'] })
  mode: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Text', required: true })
  textId: string;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'User', default: [] })
  playerIds: string[];

  @Prop({ required: true })
  startedAt: Date;

  @Prop()
  endedAt?: Date;

  @Prop({ default: false })
  isPrivate: boolean;

  @Prop()
  roomCode?: string;

  @Prop({ default: 'classic-race', index: true })
  gameId: string;
}

export const RaceSchema = SchemaFactory.createForClass(Race);
RaceSchema.index({ gameId: 1, startedAt: -1 });


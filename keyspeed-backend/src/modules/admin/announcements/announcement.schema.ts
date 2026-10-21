import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AnnouncementDocument = Announcement & Document;

@Schema({ timestamps: true })
export class Announcement {
  @Prop({ required: true, trim: true })
  message: string;

  @Prop({ type: String, enum: ['info', 'warning'], default: 'info' })
  type: 'info' | 'warning';

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: null })
  startDate?: Date;

  @Prop({ default: null })
  endDate?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AnnouncementSchema = SchemaFactory.createForClass(Announcement);
AnnouncementSchema.index({ isActive: 1, startDate: 1, endDate: 1 });


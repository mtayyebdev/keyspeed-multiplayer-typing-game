import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TextDocument = Text & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Text {
  @Prop({ required: true })
  content: string;

  @Prop({ default: 'en' })
  language: string;

  @Prop({ default: 'normal' })
  difficulty: string;

  @Prop({ required: true })
  wordCount: number;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: 0 })
  usageCount: number;

  createdAt?: Date;
}

export const TextSchema = SchemaFactory.createForClass(Text);


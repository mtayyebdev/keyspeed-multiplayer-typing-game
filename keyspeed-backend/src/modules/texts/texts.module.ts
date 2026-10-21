import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Text, TextSchema } from './schemas/text.schema';
import { TextsService } from './texts.service';
import { TextsController } from './texts.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Text.name, schema: TextSchema }]),
  ],
  controllers: [TextsController],
  providers: [TextsService],
  exports: [TextsService, MongooseModule],
})
export class TextsModule {}


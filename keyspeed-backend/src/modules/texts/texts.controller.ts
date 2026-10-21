import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TextsService } from './texts.service';

@ApiTags('texts')
@Controller('texts')
export class TextsController {
  constructor(private readonly textsService: TextsService) {}

  @Get('random')
  @ApiOperation({ summary: 'Get a random typing paragraph with optional difficulty and length' })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['all', 'easy', 'normal', 'hard'] })
  @ApiQuery({ name: 'length', required: false, enum: ['short', 'medium', 'long'] })
  async getRandomText(
    @Query('difficulty') difficulty?: string,
    @Query('length') length?: string,
  ) {
    return this.textsService.getRandomText(difficulty, length);
  }
}


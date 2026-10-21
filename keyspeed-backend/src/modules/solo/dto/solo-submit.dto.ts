import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SoloSubmitDto {
  @ApiProperty({ example: '64a789bcfe...' })
  @IsString()
  @IsNotEmpty()
  textId: string;

  @ApiProperty({ example: 'The quick brown fox...' })
  @IsString()
  typedText: string;

  @ApiProperty({ example: 45000, description: 'Duration in milliseconds' })
  @IsNumber()
  @Min(500)
  durationMs: number;
}


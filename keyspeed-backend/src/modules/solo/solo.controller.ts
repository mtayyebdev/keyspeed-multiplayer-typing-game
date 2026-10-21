import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { SoloService } from './solo.service';
import { SoloSubmitDto } from './dto/solo-submit.dto';

@ApiTags('solo')
@Controller('solo')
export class SoloController {
  constructor(
    private readonly soloService: SoloService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('submit')
  @Throttle({ default: { limit: 15, ttl: 60000 } }) // Max 15 submissions per minute per IP
  @ApiOperation({ summary: 'Submit solo test results to calculate server WPM' })
  async submitSolo(@Body() submitDto: SoloSubmitDto, @Req() req: Request) {
    let userId: string | undefined;

    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies['token']) {
      token = req.cookies['token'];
    }

    if (token) {
      try {
        const payload = this.jwtService.decode(token) as any;
        if (payload?.sub) {
          userId = payload.sub;
        }
      } catch (e) {
        // Continue unauthenticated if token invalid
      }
    }

    return this.soloService.submitSolo(submitDto, userId);
  }
}


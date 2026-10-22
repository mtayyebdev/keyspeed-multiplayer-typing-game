import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  tokenVersion?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies['keyspeed_token'] || req.cookies['token'];
          }
          return token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found or session expired');
    }

    if (user.isBanned) {
      throw new UnauthorizedException(
        `Your account has been banned: ${user.bannedReason || 'Violation of terms'}`,
      );
    }

    if (
      payload.tokenVersion !== undefined &&
      user.tokenVersion !== undefined &&
      payload.tokenVersion < user.tokenVersion
    ) {
      throw new UnauthorizedException('Session invalidated. Please log in again.');
    }

    return {
      sub: user._id.toString(),
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role || 'user',
      isBanned: user.isBanned || false,
      tokenVersion: user.tokenVersion || 0,
    };
  }
}


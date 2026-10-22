import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Settings, SettingsDocument } from '../admin/settings/settings.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Settings.name) private settingsModel: Model<SettingsDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    // Check platform settings
    const settings = await this.settingsModel.findOne().exec();
    if (settings) {
      if (settings.maintenanceMode) {
        throw new ForbiddenException('Platform is currently in maintenance mode');
      }
      if (settings.registrationEnabled === false) {
        throw new ForbiddenException('New registrations are currently closed by administrator');
      }
    }

    // Check duplicate username
    const existingUser = await this.userModel.findOne({
      username: username.trim(),
    });
    if (existingUser) {
      throw new ConflictException('Username is already taken');
    }

    // Check duplicate email
    const existingEmail = await this.userModel.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingEmail) {
      throw new ConflictException('Email address is already registered');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = new this.userModel({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'user',
      isBanned: false,
      tokenVersion: 0,
      avgWpm: 0,
      bestWpm: 0,
      racesPlayed: 0,
      racesWon: 0,
    });

    const saved = await newUser.save();

    const payload = {
      sub: saved._id.toString(),
      username: saved.username,
      email: saved.email,
      role: saved.role || 'user',
      tokenVersion: saved.tokenVersion || 0,
    };
    const token = this.jwtService.sign(payload);

    return {
      keyspeed_token: token,
      token,
      user: {
        id: saved._id,
        username: saved.username,
        email: saved.email,
        role: saved.role || 'user',
        avgWpm: saved.avgWpm,
        bestWpm: saved.bestWpm,
        racesPlayed: saved.racesPlayed,
        racesWon: saved.racesWon,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isBanned) {
      throw new UnauthorizedException(
        `Your account has been banned: ${user.bannedReason || 'Violation of terms'}`,
      );
    }

    // Check maintenance mode
    const settings = await this.settingsModel.findOne().exec();
    if (settings?.maintenanceMode && user.role !== 'admin') {
      throw new ForbiddenException('Platform is currently in maintenance mode. Non-admin logins are temporarily paused.');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const payload = {
      sub: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role || 'user',
      tokenVersion: user.tokenVersion || 0,
    };
    const token = this.jwtService.sign(payload);

    return {
      keyspeed_token: token,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        avgWpm: user.avgWpm,
        bestWpm: user.bestWpm,
        racesPlayed: user.racesPlayed,
        racesWon: user.racesWon,
      },
    };
  }
}


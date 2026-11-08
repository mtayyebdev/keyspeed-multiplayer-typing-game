import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { RaceResult, RaceResultDocument } from '../races/schemas/race-result.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(RaceResult.name) private raceResultModel: Model<RaceResultDocument>,
  ) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-passwordHash').exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username: username.trim() }).exec();
  }

  async getPublicProfile(username: string) {
    const user = await this.userModel
      .findOne({ username: username.trim() })
      .select('-passwordHash -email')
      .exec();

    if (!user) {
      throw new NotFoundException(`Racer @${username} not found`);
    }

    // Also get their last 10 race results
    const lastResults = await this.raceResultModel
      .find({ userId: user._id, flagged: false })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('raceId', 'mode startedAt')
      .exec();

    // Stats per game
    const gameStatsAgg = await this.raceResultModel.aggregate([
      { $match: { userId: user._id, flagged: false } },
      {
        $group: {
          _id: { $ifNull: ['$gameId', 'classic-race'] },
          racesPlayed: { $sum: 1 },
          racesWon: { $sum: { $cond: [{ $eq: ['$position', 1] }, 1, 0] } },
          avgWpm: { $avg: '$wpm' },
          bestWpm: { $max: '$wpm' },
          topSpeed: { $max: '$topSpeed' },
        },
      },
    ]);

    const statsByGame: Record<string, any> = {
      'classic-race': {
        racesPlayed: 0,
        racesWon: 0,
        avgWpm: 0,
        bestWpm: 0,
      },
      'car-race': {
        racesPlayed: 0,
        racesWon: 0,
        avgWpm: 0,
        bestWpm: 0,
        topSpeed: 0,
      },
    };

    for (const item of gameStatsAgg) {
      const gId = item._id || 'classic-race';
      statsByGame[gId] = {
        racesPlayed: item.racesPlayed,
        racesWon: item.racesWon,
        avgWpm: Math.round(item.avgWpm || 0),
        bestWpm: Math.round(item.bestWpm || 0),
        topSpeed: Math.round(item.topSpeed || 0),
      };
    }

    return {
      user: {
        id: user._id,
        username: user.username,
        avgWpm: user.avgWpm,
        bestWpm: user.bestWpm,
        racesPlayed: user.racesPlayed,
        racesWon: user.racesWon,
        createdAt: user.createdAt,
      },
      statsByGame,
      lastResults,
    };
  }

  async getMyResults(userId: string) {
    return this.raceResultModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('raceId', 'mode startedAt')
      .exec();
  }

  async updateUserStats(userId: string, newWpm: number, isWinner: boolean) {
    const user = await this.userModel.findById(userId);
    if (!user) return;

    const previousRaces = user.racesPlayed || 0;
    const currentRaces = previousRaces + 1;
    const newAvgWpm = Math.round(
      ((user.avgWpm || 0) * previousRaces + newWpm) / currentRaces,
    );
    const newBestWpm = Math.max(user.bestWpm || 0, newWpm);
    const newWon = (user.racesWon || 0) + (isWinner ? 1 : 0);

    user.racesPlayed = currentRaces;
    user.avgWpm = newAvgWpm;
    user.bestWpm = newBestWpm;
    user.racesWon = newWon;

    await user.save();
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const saltRounds = 10;
    user.passwordHash = await bcrypt.hash(newPass, saltRounds);
    await user.save();

    return { message: 'Password updated successfully' };
  }

  async deleteAccount(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete all user race results
    await this.raceResultModel.deleteMany({ userId }).exec();

    // Delete user
    await this.userModel.findByIdAndDelete(userId).exec();

    return { message: 'Account deleted successfully' };
  }
}


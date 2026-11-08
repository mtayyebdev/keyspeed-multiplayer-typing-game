import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Race, RaceDocument } from './schemas/race.schema';
import { RaceResult, RaceResultDocument } from './schemas/race-result.schema';
import { UsersService } from '../users/users.service';

export interface FinalPlayerResult {
  userId: string | null;
  username: string;
  isBot: boolean;
  position: number;
  wpm: number;
  accuracy: number;
  errors: number;
  flagged: boolean;
  topSpeed?: number;
  avgSpeed?: number;
  stalls?: number;
}

@Injectable()
export class RacesService {
  private readonly logger = new Logger(RacesService.name);

  constructor(
    @InjectModel(Race.name) private raceModel: Model<RaceDocument>,
    @InjectModel(RaceResult.name) private raceResultModel: Model<RaceResultDocument>,
    private readonly usersService: UsersService,
  ) {}

  async createAndSaveCompletedRace(
    mode: 'solo' | 'race',
    textId: string,
    startedAt: Date,
    endedAt: Date,
    isPrivate: boolean,
    roomCode: string | undefined,
    standings: FinalPlayerResult[],
    gameId: string = 'classic-race',
  ) {
    const humanPlayerIds = standings
      .filter((s) => !s.isBot && s.userId)
      .map((s) => s.userId as string);

    const race = new this.raceModel({
      mode,
      gameId: gameId || 'classic-race',
      textId,
      playerIds: humanPlayerIds,
      startedAt,
      endedAt,
      isPrivate,
      roomCode,
    });
    const savedRace = await race.save();

    for (const standing of standings) {
      const result = new this.raceResultModel({
        raceId: savedRace._id,
        gameId: gameId || 'classic-race',
        userId: standing.userId,
        isBot: standing.isBot,
        position: standing.position,
        wpm: standing.wpm,
        accuracy: standing.accuracy,
        errors: standing.errors,
        topSpeed: standing.topSpeed ?? null,
        avgSpeed: standing.avgSpeed ?? null,
        stalls: standing.stalls ?? null,
        flagged: standing.flagged,
        reviewStatus: standing.flagged ? 'pending' : 'none',
        flaggedReason: standing.flagged ? 'Anti-cheat threshold flagged' : null,
      });
      await result.save();

      // Update user stats if human racer
      if (!standing.isBot && standing.userId && !standing.flagged) {
        const isWinner = standing.position === 1;
        await this.usersService.updateUserStats(
          standing.userId,
          standing.wpm,
          isWinner,
        );
      }
    }

    this.logger.log(`Race ${savedRace._id} saved with ${standings.length} participants.`);
    return savedRace;
  }
}


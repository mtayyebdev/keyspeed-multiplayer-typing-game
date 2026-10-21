import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { RaceGateway } from './race.gateway';
import { RoomService } from './room.service';
import { MatchmakingService } from './matchmaking.service';
import { BotService } from './bot.service';
import { TextsModule } from '../texts/texts.module';
import { RacesModule } from '../races/races.module';
import { UsersModule } from '../users/users.module';
import { ClassicRaceEngine } from '../../games/classic-race.engine';
import { Settings, SettingsSchema } from '../admin/settings/settings.schema';

@Module({
  imports: [
    TextsModule,
    RacesModule,
    UsersModule,
    MongooseModule.forFeature([{ name: Settings.name, schema: SettingsSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret:
          configService.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  providers: [
    RaceGateway,
    RoomService,
    MatchmakingService,
    BotService,
    ClassicRaceEngine,
  ],
  exports: [RaceGateway, RoomService],
})
export class RealtimeModule {}


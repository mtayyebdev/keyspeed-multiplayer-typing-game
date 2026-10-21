import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TextsModule } from './modules/texts/texts.module';
import { SoloModule } from './modules/solo/solo.module';
import { RacesModule } from './modules/races/races.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { LeaderboardModule } from './modules/leaderboard/leaderboard.module';
import { SettingsModule } from './modules/admin/settings/settings.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 120, // 120 reqs/min global baseline
      },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://127.0.0.1:27017/keyspeed',
      }),
    }),
    SettingsModule,
    AuthModule,
    UsersModule,
    TextsModule,
    SoloModule,
    RacesModule,
    RealtimeModule,
    LeaderboardModule,
    AdminModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}


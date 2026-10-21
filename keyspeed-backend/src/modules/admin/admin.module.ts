import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { UsersModule } from '../users/users.module';
import { RacesModule } from '../races/races.module';
import { TextsModule } from '../texts/texts.module';

// Schemas
import { User, UserSchema } from '../users/schemas/user.schema';
import { Race, RaceSchema } from '../races/schemas/race.schema';
import { RaceResult, RaceResultSchema } from '../races/schemas/race-result.schema';
import { Text, TextSchema } from '../texts/schemas/text.schema';
import { AuditLog, AuditLogSchema } from './audit/audit.schema';
import { Settings, SettingsSchema } from './settings/settings.schema';
import { Announcement, AnnouncementSchema } from './announcements/announcement.schema';

// Guards
import { RolesGuard } from './guards/roles.guard';

// Services
import { AuditService } from './audit/audit.service';
import { OverviewService } from './overview/overview.service';
import { AdminUsersService } from './users/admin-users.service';
import { AdminRacesService } from './races/admin-races.service';
import { AdminFlaggedService } from './flagged/admin-flagged.service';
import { AdminTextsService } from './texts/admin-texts.service';
import { AdminLeaderboardService } from './leaderboard/admin-leaderboard.service';
import { AdminLiveService } from './live/admin-live.service';
import { SettingsService } from './settings/settings.service';
import { AnnouncementsService } from './announcements/announcements.service';

// Gateways
import { AdminLiveGateway } from './live/admin-live.gateway';

// Controllers
import { AuditController } from './audit/audit.controller';
import { OverviewController } from './overview/overview.controller';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminRacesController } from './races/admin-races.controller';
import { AdminFlaggedController } from './flagged/admin-flagged.controller';
import { AdminTextsController } from './texts/admin-texts.controller';
import { AdminLeaderboardController } from './leaderboard/admin-leaderboard.controller';
import { AdminLiveController } from './live/admin-live.controller';
import {
  PublicAnnouncementsController,
  AdminAnnouncementsController,
} from './announcements/announcements.controller';

@Module({
  imports: [
    AuthModule,
    RealtimeModule,
    UsersModule,
    RacesModule,
    TextsModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Race.name, schema: RaceSchema },
      { name: RaceResult.name, schema: RaceResultSchema },
      { name: Text.name, schema: TextSchema },
      { name: Announcement.name, schema: AnnouncementSchema },
    ]),
  ],
  controllers: [
    OverviewController,
    AdminUsersController,
    AdminRacesController,
    AdminFlaggedController,
    AdminTextsController,
    AdminLeaderboardController,
    AdminLiveController,
    PublicAnnouncementsController,
    AdminAnnouncementsController,
    AuditController,
  ],
  providers: [
    RolesGuard,
    OverviewService,
    AdminUsersService,
    AdminRacesService,
    AdminFlaggedService,
    AdminTextsService,
    AdminLeaderboardService,
    AdminLiveService,
    AdminLiveGateway,
    AnnouncementsService,
  ],
  exports: [RolesGuard],
})
export class AdminModule {}


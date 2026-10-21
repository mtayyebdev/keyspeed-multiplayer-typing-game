import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Settings, SettingsSchema } from './settings.schema';
import { AuditLog, AuditLogSchema } from '../audit/audit.schema';
import { SettingsService } from './settings.service';
import { AuditService } from '../audit/audit.service';
import {
  PublicSettingsController,
  AdminSettingsController,
} from './settings.controller';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Settings.name, schema: SettingsSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  providers: [SettingsService, AuditService],
  controllers: [PublicSettingsController, AdminSettingsController],
  exports: [SettingsService, AuditService, MongooseModule],
})
export class SettingsModule {}


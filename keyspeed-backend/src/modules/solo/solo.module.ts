import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { TextsModule } from '../texts/texts.module';
import { UsersModule } from '../users/users.module';
import { Race, RaceSchema } from '../races/schemas/race.schema';
import { RaceResult, RaceResultSchema } from '../races/schemas/race-result.schema';
import { SoloService } from './solo.service';
import { SoloController } from './solo.controller';

@Module({
  imports: [
    TextsModule,
    UsersModule,
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: Race.name, schema: RaceSchema },
      { name: RaceResult.name, schema: RaceResultSchema },
    ]),
  ],
  controllers: [SoloController],
  providers: [SoloService],
  exports: [SoloService],
})
export class SoloModule {}


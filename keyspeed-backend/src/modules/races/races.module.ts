import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Race, RaceSchema } from './schemas/race.schema';
import { RaceResult, RaceResultSchema } from './schemas/race-result.schema';
import { UsersModule } from '../users/users.module';
import { RacesService } from './races.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([
      { name: Race.name, schema: RaceSchema },
      { name: RaceResult.name, schema: RaceResultSchema },
    ]),
  ],
  providers: [RacesService],
  exports: [RacesService, MongooseModule],
})
export class RacesModule {}


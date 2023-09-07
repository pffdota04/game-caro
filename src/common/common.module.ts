import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IDService } from './services/id.service';
import { RedisService } from './services/redis.service';
import { TaptapService } from './services/taptap.service';
import { TaptapApiService } from './services/taptap-api.service';
import { RoomService } from 'src/room/room.service';

@Module({
  imports: [ConfigModule],
  exports: [
    RedisService,
    IDService,
    TaptapService,
    TaptapApiService,
    RoomService,
  ],
  providers: [
    RedisService,
    IDService,
    TaptapService,
    TaptapApiService,
    RoomService,
  ],
})
export class CommonModule {}

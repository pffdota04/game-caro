import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from './config/config.module';
import { GameController } from './game/game.controller';
import { GameService } from './game/game.service';
import { RoomService } from './room/room.service';

@Module({
  imports: [ConfigModule],
  controllers: [AppController, GameController],
  providers: [GameService, RoomService],
})
export class AppModule {}

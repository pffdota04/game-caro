import { NestFactory } from '@nestjs/core';
import { monitor } from '@colyseus/monitor';
import { Server, LobbyRoom } from 'colyseus';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { RoomService } from './room/room.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(helmet());

  let port = '3011';

  const gameServer = new Server();

  app.use('/colyseus', monitor());

  app.use('/health', (req, res) => {
    res.status(200).send('Ok ');
  });

  gameServer.define('lobby', LobbyRoom);
  gameServer.define('RoomCaro', RoomService).enableRealtimeListing();
  gameServer.attach({ server: app.getHttpServer() });

  try {
    await app.listen(port);
  } catch (error) {}
}
bootstrap();

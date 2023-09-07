import { NestFactory } from '@nestjs/core';
import { monitor } from '@colyseus/monitor';
import { Server, RedisPresence, LobbyRoom } from 'colyseus';
import { RedisDriver } from '@colyseus/redis-driver';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { RoomService } from './room/room.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      validatorPackage: require('@nestjs/class-validator'),
      transformerPackage: require('@nestjs/class-transformer'),
    }),
  );

  let port =
    Number(process.env.PORT) +
    Number(process.env.NODE_APP_INSTANCE ? process.env.NODE_APP_INSTANCE : 0);

  //local thi gan the, port
  const publicAddress =
    process.env.APP_ENV !== 'local'
      ? process.env.MY_CHANNEL
      : process.env.MY_CHANNEL + ':' + port;

  const gameServer = new Server({
    presence: new RedisPresence({
      port: Number(process.env.REDIS_PORT),
      prefix: process.env.REDIS_PREFIX,
      host: process.env.REDIS_HOST,
    }),
    driver: new RedisDriver({
      port: Number(process.env.REDIS_PORT),
      prefix: process.env.REDIS_PREFIX,
      host: process.env.REDIS_HOST,
    }),
    publicAddress: publicAddress,
  });
  console.log('APP_ENV: ', process.env.APP_ENV);
  console.log('publicAddress: ', publicAddress);

  if (process.env.APP_ENV == 'local') {
    app.use('/colyseus', monitor());
  }

  app.use('/health', (req, res) => {
    res.status(200).send('Ok ' + publicAddress);
  });

  gameServer.define('lobby', LobbyRoom);
  gameServer.define('RoomCaro', RoomService).enableRealtimeListing();
  gameServer.attach({ server: app.getHttpServer() });

  try {
    await app.listen(port);
  } catch (error) {}
}
bootstrap();

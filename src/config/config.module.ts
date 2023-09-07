import { Module } from '@nestjs/common';
import {
  ConfigService,
  ConfigModule as NestConfigModule,
} from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  configuration,
  validationSchema,
  type ConfigSchema,
} from './env.validation';

@Module({
  imports: [
    // env
    NestConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      validationSchema,
      validationOptions: { abortEarly: true },
    }),

    // rate limit
    ThrottlerModule.forRootAsync({
      imports: [NestConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<ConfigSchema>) => ({
        ttl: config.get('THROTTLE_TTL'),
        limit: config.get('THROTTLE_LIMIT'),
      }),
    }),
  ],
})
export class ConfigModule {}

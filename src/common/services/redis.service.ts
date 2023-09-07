import type { ConfigSchema } from 'src/config/env.validation';
import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bluebird from 'bluebird';
import * as base from 'redis';
import RedLock from 'redlock';
import Client from 'ioredis';

const redis = bluebird.promisifyAll(base);

@Injectable()
export class RedisService
  implements OnApplicationShutdown, OnApplicationBootstrap
{
  private logger = new Logger(RedisService.name);
  private client: ReturnType<typeof redis.createClient>;
  private redLock: RedLock;
  private maxTimeExecute: number;

  constructor(private configService: ConfigService<ConfigSchema>) {
    this.maxTimeExecute = 60 * 60 * 1000;
  }

  // Hooks

  async onApplicationBootstrap() {
    await this.connect();
  }

  async onApplicationShutdown() {
    await this.disconnect();
  }

  // Init client

  async connect() {
    const options = {
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      prefix: this.configService.get('REDIS_PREFIX') + ':',
    };

    const client = redis.createClient(options);

    client.on('connect', () => {
      this.logger.log('Redis is connecting');
    });

    client.on('ready', () => {
      this.logger.log('Redis is ready');
    });

    client.on('error', (error) => {
      this.logger.error(error.message);
    });

    this.client = client;

    const redisIo = new Client({
      port: options.port,
      host: options.host,
      keyPrefix: options.prefix,
    });

    const redLock = new RedLock([redisIo], {
      driftFactor: 0.01,

      retryCount: 120,

      retryDelay: 5000,

      retryJitter: 500,

      automaticExtensionThreshold: 60000,
    });

    this.redLock = redLock;
  }

  async disconnect() {
    if (this.client && this.client.connected) {
      await this.client.quit();
    }
  }

  // Redis commands

  getAsync(key: string) {
    return this.client.getAsync(key);
  }

  setAsync(key: string, value: unknown) {
    return this.client.setAsync(key, value);
  }

  setExAsync(key: string, value: unknown, expire: number) {
    return this.client.setAsync(key, value, 'EX', expire);
  }

  setExNxAsync(key: string, value: unknown, expire: number) {
    return this.client.setAsync(key, value, 'NX', 'EX', expire);
  }

  setExAtAsync(key: string, value: unknown, timestamp: number) {
    return this.client.setAsync(key, value, 'EXAT', timestamp);
  }

  delAsync(key: string) {
    return this.client.delAsync(key);
  }

  hgetAsync(hash: string, key: string) {
    return this.client.HGETAsync(hash, key);
  }

  hsetAsync(hash: string, key: string, value: unknown) {
    return this.client.HSETAsync(hash, key, value);
  }

  zaddAsync(key: string, score: number, member: string) {
    return this.client.ZADDAsync(key, score, member);
  }

  zincrbyAsync(key: string, increment: number, member: string) {
    return this.client.ZINCRBYAsync(key, increment, member);
  }

  zrangeAsync(key: string, start: number, end: number) {
    const args = [key, start, end, 'REV', 'WITHSCORES'];
    return this.client.ZRANGEAsync(...args);
  }

  zrevrankAsync(key: string, member: string) {
    return this.client.ZREVRANKAsync(key, member);
  }

  async hgetAsyncCheckStock(key: string) {
    if (key.includes('unlimit')) return true;
    const check = await this.client.HGETAsync('stock_nngg', key);
    console.log(check < 1 || check === null ? false : true);

    return check < 1 || check === null ? false : true;
  }

  HINCRBY(offerId: string, issue: number) {
    return this.client.HINCRBY('stock_nngg', offerId, issue);
  }

  async redlockResource(key: string, func: () => Promise<any>) {
    const lock = await this.redLock.acquire([key], this.maxTimeExecute);
    this.logger.log(`Lock resource ${key}`);
    try {
      const result = await func();
      return result;
    } finally {
      await lock.release();
      this.logger.log(`Release resource ${key}`);
    }
  }
}

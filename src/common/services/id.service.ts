import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { RedisService } from './redis.service';

const ID_SERVICE_CACHE_KEY = 'id_service:access_token';

@Injectable()
export class IDService {
  private logger = new Logger(IDService.name);

  constructor(
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  async getToken() {
    const cached = await this.redisService.getAsync(ID_SERVICE_CACHE_KEY);

    if (cached) {
      return cached;
    }

    const { token, expireAt } = await this.requestToken();

    if (!token) {
      throw new Error('Cannot get IDService token');
    }

    await this.redisService.setExAtAsync(ID_SERVICE_CACHE_KEY, token, expireAt);
    return token;
  }

  async requestToken(): Promise<{ token: string; expireAt: number }> {
    const config = this.getConfig();
    const response = await axios.post(`${config.url}/token`, {
      clientName: config.clientName,
      secret: config.secretKey,
    });

    const { status, data } = response.data;

    if (status.success) {
      const { token, createdAt, expireIn } = data;
      const expireAt = Number(createdAt) + Number(expireIn); // timestamp seconds
      this.logger.log(`New token is expired at: ${expireAt}`);
      return { token, expireAt };
    }

    throw new Error('Cannot get IDService token');
  }

  getConfig() {
    const url = this.configService.get('ID_SERVICE_HOST');
    const clientName = this.configService.get('ID_SERVICE_NAME');
    const secretKey = this.configService.get('ID_SERVICE_SECRET');
    return { url, clientName, secretKey };
  }
}

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { getAccessTokenKey, getBearerToken } from '../../utils';
import { RedisService } from '../services/redis.service';

type IUser = {
  userId: string;
  mobile: string;
  leaderboardId: string;
  screen: string;
};

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header = request.header('Authorization');
    const token = getBearerToken(header);
    const user = await this.validateToken(token);

    if (user) {
      request.user = user;
      return true;
    }

    throw new UnauthorizedException();
  }

  async validateToken(token: string): Promise<IUser | null> {
    if (!token) return null;
    const key = getAccessTokenKey(token);
    const data = await this.redisService.getAsync(key);

    if (!data) return null;

    const user = JSON.parse(data);
    return user;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { IDService } from './id.service';

@Injectable()
export class TaptapService {
  private logger = new Logger(TaptapService.name);

  constructor(private idService: IDService) {}

  get(url: string, params?: any) {
    return this.request({ method: 'get', url, params });
  }

  post(url: string, data?: any) {
    return this.request({ method: 'post', url, data });
  }

  put(url: string, data?: any) {
    return this.request({ method: 'put', url, data });
  }

  patch(url: string, data?: any) {
    return this.request({ method: 'patch', url, data });
  }

  delete(url: string, data?: any) {
    return this.request({ method: 'delete', url, data });
  }

  private validateStatus(status) {
    return status >= 200 && status < 600; // forward error code and message to client
  }

  // customized axios request
  private async request(config: AxiosRequestConfig) {
    try {
      const token = await this.idService.getToken();

      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const response = await axios.request({
        ...config,
        headers,
        validateStatus: this.validateStatus,
        timeout: 120 * 1000, // ms
      });

      return response.data;
    } catch (error) {
      this.handleAxiosError(error);
      throw error;
    }
  }

  // https://github.com/axios/axios#handling-errors
  private handleAxiosError({ message, config, response }) {
    const logError: any = { message, config };
    if (response) {
      logError.response = {
        status: response.status,
        headers: response.headers,
        data: response.data,
      };
    }
    this.logger.error(JSON.stringify(logError));
  }
}

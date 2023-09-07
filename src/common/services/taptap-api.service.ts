import { Inject, Injectable, Logger, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import axios, { AxiosRequestConfig } from 'axios';
import { Request } from 'express';
import * as FormData from 'form-data';
import { IDService } from './id.service';

interface IGetUserAuthInfoRequest extends Request {
  user: any;
}

@Injectable({ scope: Scope.REQUEST })
export class TaptapApiService {
  private readonly logger = new Logger(TaptapApiService.name);
  private timeout: number;

  constructor(
    private readonly idService: IDService,
    @Inject(REQUEST) private req: IGetUserAuthInfoRequest,
  ) {
    this.timeout = 120000;
  }

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

  delete(baseUrl: string, id?: string, data?: any) {
    const url = id ? `${baseUrl}/${id}` : baseUrl;
    return this.request({ method: 'delete', url, data });
  }

  private validateStatus(status: number) {
    return status >= 200 && status < 600; // forward error code and message to client
  }

  // customized axios request
  private async request(config: AxiosRequestConfig) {
    try {
      const headers = {
        Authorization: await this.headersAuthorization(),
        'Content-Type': 'application/json',
        'x-taptap-user': this.req?.user ? JSON.stringify(this.req.user) : '',
      };

      const result = await axios.request({
        ...config,
        headers,
        validateStatus: this.validateStatus,
        timeout: this.timeout,
      });
      return { error: null, data: result.data };
    } catch (error) {
      this.handleAxiosError(error);
      return { error: error.message, data: null };
    }
  }

  async postFileFormData(url: string, file: any, params?: any) {
    return this.formDataWithFile(url, 'post', file, params);
  }

  async putFileFormData(url: string, file: any, params?: any) {
    return this.formDataWithFile(url, 'put', file, params);
  }

  // https://github.com/axios/axios#handling-errors
  handleAxiosError({
    message,
    config,
    response,
  }: {
    message: any;
    config: any;
    response: any;
  }) {
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

  private async headersAuthorization() {
    const token = await this.idService.getToken();
    return `Bearer ${token}`;
  }

  async formDataWithFile(
    url: string,
    method: string,
    file?: any,
    params?: any,
  ) {
    try {
      const data = new FormData();
      if (params) {
        const parseParams = Object.keys(params).map((key) => [
          { key, value: params[key] },
        ]);
        if (parseParams.length) {
          for (const param of parseParams) {
            if (param.length) {
              for (const item of param) {
                data.append(item.key, item.value);
              }
            }
          }
        }
      }
      if (file) data.append('file', file.buffer, file.originalname);

      const config: any = {
        method,
        url,
        headers: {
          Authorization: await this.headersAuthorization(),
          ...data.getHeaders(),
          'x-taptap-user': this.req.user ? JSON.stringify(this.req.user) : '',
        },
        validateStatus: this.validateStatus,
        timeout: this.timeout,
        data,
      };

      const result: any = await axios.request(config);
      if (result.data.status) {
        return {
          error: null,
          data: result.data,
        };
      }
      return {
        error: null,
        data: {
          fileResponse: result.data,
          fileName: result.headers['content-disposition'].split('filename=')[1],
        },
      };
    } catch (error) {
      this.handleAxiosError(error);
      return { error: error.message, data: null };
    }
  }
}

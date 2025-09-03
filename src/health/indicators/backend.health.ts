import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ServiceHealth } from '../types/health.types';

@Injectable()
export class BackendHealthIndicator {
  private readonly logger = new Logger(BackendHealthIndicator.name);

  constructor(private readonly configService: ConfigService) {}

  async check(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const url = this.configService.get<string>('BACKEND_URL_HEALTH_CHECK');

      if (!url) {
        this.logger.error('BACKEND_URL_HEALTH_CHECK is not set');
        return {
          status: 'down',
          responseTimeMs: 10000,
          error: 'Health check URL not configured',
        };
      }

      try {
        new URL(url);
      } catch {
        this.logger.error(`Invalid URL: ${url}`);
        return {
          status: 'down',
          responseTimeMs: 10000,
          error: 'Health check URL is invalid',
        };
      }

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Uptime/1.0',
        },

        maxRedirects: 3,

        validateStatus: (status) => {
          return (
            (status >= 200 && status < 300) ||
            status === 404 ||
            (status >= 400 && status < 500)
          );
        },
      });

      const responseTime = Date.now() - startTime;

      let healthStatus: 'ok' | 'degraded' | 'down' = 'ok';

      if (response.status === 404) {
        healthStatus = responseTime > 2000 ? 'degraded' : 'ok';
      } else if (response.status >= 500) {
        healthStatus = 'down';
      } else if (response.status >= 400) {
        healthStatus = responseTime > 2000 ? 'degraded' : 'ok';
      } else {
        healthStatus = responseTime > 2000 ? 'degraded' : 'ok';
      }

      return {
        status: healthStatus,
        responseTimeMs: responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      let errorMessage = 'Unknown error';

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          errorMessage = 'Connection refused - service may be offline';
        } else if (error.code === 'ETIMEDOUT') {
          errorMessage = 'Timeout - service did not respond in time';
        } else if (error.code === 'ERR_NAME_NOT_RESOLVED') {
          errorMessage = 'DNS not resolved - domain may not exist';
        } else if (error.response) {
          const status = error.response.status;
          if (status >= 500) {
            errorMessage = `Server error: HTTP ${status} - ${error.response.statusText}`;
          } else {
            errorMessage = `HTTP ${status} - ${error.response.statusText}`;
          }
        } else if (error.request) {
          errorMessage = 'No response from server';
        } else {
          errorMessage = error.message;
        }
      } else {
        errorMessage = error.message;
      }

      return {
        status: 'down',
        responseTimeMs: responseTime,
        error: errorMessage,
      };
    }
  }

  async checkInternal(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const responseTime = Date.now() - startTime;

      return {
        status: 'ok',
        responseTimeMs: responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'down',
        responseTimeMs: responseTime,
        error: error.message,
      };
    }
  }
}

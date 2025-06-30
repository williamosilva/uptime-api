import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CustomHttpHealthIndicator extends HealthIndicator {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async pingCheck(
    key: string,
    url: string,
    timeout = 10000,
    degradedThreshold = 2000,
  ): Promise<HealthIndicatorResult> {
    const startTime = Date.now();

    try {
      await axios.get(url, { timeout });
      const responseTime = Date.now() - startTime;

      const isHealthy = responseTime <= degradedThreshold;
      const status = responseTime > degradedThreshold ? 'degraded' : 'ok';

      const result = this.getStatus(key, isHealthy, {
        status,
        responseTimeMs: responseTime,
      });

      if (!isHealthy) {
        throw new HealthCheckError('Service is degraded', result);
      }

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      const result = this.getStatus(key, false, {
        status: 'down',
        responseTimeMs: responseTime,
        error: error.message,
      });

      throw new HealthCheckError('Service is down', result);
    }
  }
}

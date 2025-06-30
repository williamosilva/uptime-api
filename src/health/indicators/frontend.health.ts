import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ServiceHealth } from '../types/health.types';

@Injectable()
export class FrontendHealthIndicator {
  constructor(private readonly configService: ConfigService) {}

  async check(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const url = this.configService.get<string>('FRONTEND_URL') || '';

      await axios.get(url, { timeout: 5000 });
      const responseTime = Date.now() - startTime;

      return {
        status: responseTime > 2000 ? 'degraded' : 'ok',
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

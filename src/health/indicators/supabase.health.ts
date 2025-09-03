import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceHealth } from '../types/health.types';

@Injectable()
export class SupabaseHealthIndicator {
  private readonly logger = new Logger(SupabaseHealthIndicator.name);

  constructor(private readonly configService: ConfigService) {}

  async check(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const supabaseUrl = this.configService.get<string>(
        'SUPABASE_URL_HEALTH_CHECK',
      );
      const supabaseKey = this.configService.get<string>(
        'SUPABASE_ANON_KEY_HEALTH_CHECK',
      );

      if (!supabaseUrl || !supabaseKey) {
        this.logger.error(
          'SUPABASE_URL_HEALTH_CHECK or SUPABASE_ANON_KEY_HEALTH_CHECK are not configured',
        );
        return {
          status: 'absent',
          responseTimeMs: 0,
        };
      }

      try {
        new URL(supabaseUrl);
      } catch {
        this.logger.error(`Invalid URL: ${supabaseUrl}`);
        return {
          status: 'down',
          responseTimeMs: 10000,
          error: 'Invalid health check URL',
        };
      }

      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'User-Agent': 'Uptime/1.0',
        },
        signal: AbortSignal.timeout(10000),
      });

      const responseTime = Date.now() - startTime;

      let healthStatus: 'ok' | 'degraded' | 'down' = 'ok';

      if (response.status === 401 || response.status === 403) {
        healthStatus = responseTime > 2000 ? 'degraded' : 'ok';
      } else if (response.status === 404) {
        healthStatus = responseTime > 2000 ? 'degraded' : 'ok';
      } else if (response.status >= 500) {
        healthStatus = 'down';
      } else if (response.status >= 400) {
        healthStatus = responseTime > 2000 ? 'degraded' : 'ok';
      } else if (response.status >= 200 && response.status < 300) {
        healthStatus = responseTime > 2000 ? 'degraded' : 'ok';
      } else {
        healthStatus = 'down';
      }

      if (!response.ok && response.status < 500) {
        return {
          status: healthStatus,
          responseTimeMs: responseTime,
        };
      }

      return {
        status: healthStatus,
        responseTimeMs: responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      const finalResponseTime = responseTime < 1000 ? 10000 : responseTime;

      let errorMessage = 'Unknown error';

      if (error.name === 'AbortError') {
        errorMessage = 'Timeout - Supabase did not respond in a timely manner';
      } else if (
        error.name === 'TypeError' &&
        error.message.includes('fetch')
      ) {
        if (error.cause?.code === 'ECONNREFUSED') {
          errorMessage = 'Connection refused - Supabase may be offline';
        } else if (error.cause?.code === 'ENOTFOUND') {
          errorMessage = 'DNS not resolved - Supabase domain may not exist';
        } else {
          errorMessage = 'Network error - unable to connect to Supabase';
        }
      } else {
        errorMessage =
          error.code || error?.cause?.code || error.message || 'UNKNOWN';
      }

      return {
        status: 'down',
        responseTimeMs: finalResponseTime,
        error: errorMessage,
      };
    }
  }
}

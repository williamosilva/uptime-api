import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServiceHealth } from '../types/health.types';

@Injectable()
export class SupabaseHealthIndicator {
  constructor(private readonly configService: ConfigService) {}

  async check(): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const supabaseUrl =
        this.configService.get<string>('SUPABASE_URL_HEALTH_CHECK') || '';
      const supabaseKey =
        this.configService.get<string>('SUPABASE_ANON_KEY_HEALTH_CHECK') || '';

      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      });

      const responseTime = Date.now() - startTime;
      console.log(response);
      if (!response.ok) {
        return {
          status: 'down',
          responseTimeMs: responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        status: responseTime > 1000 ? 'degraded' : 'ok',
        responseTimeMs: responseTime,
      };
    } catch (error) {
      console.log(error);
      const responseTime = Date.now() - startTime;
      return {
        status: 'down',
        responseTimeMs: responseTime,
        error: error.code || error?.cause?.code || 'UNKNOWN',
      };
    }
  }
}

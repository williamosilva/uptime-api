import { Injectable } from '@nestjs/common';
import { FrontendHealthIndicator } from './indicators/frontend.health';
import { BackendHealthIndicator } from './indicators/backend.health';
import { SupabaseHealthIndicator } from './indicators/supabase.health';
import { HealthResponse, ServiceHealth } from './types/health.types';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(
    private readonly frontend: FrontendHealthIndicator,
    private readonly backend: BackendHealthIndicator,
    private readonly supabase: SupabaseHealthIndicator,
  ) {}

  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  private getOverallStatus(
    services: Record<string, ServiceHealth>,
  ): 'ok' | 'degraded' | 'down' {
    const statuses = Object.values(services)
      .filter((service) => service.status !== 'absent')
      .map((service) => service.status);
    if (statuses.includes('down')) {
      return 'down';
    }

    if (statuses.includes('degraded')) {
      return 'degraded';
    }

    return 'ok';
  }

  async checkFrontend(): Promise<HealthResponse> {
    const frontendHealth = await this.frontend.check();

    return {
      status: frontendHealth.status,
      // uptime: this.getUptime(),
      timestamp: new Date().toISOString(),
      services: {
        frontend: frontendHealth,
      },
    };
  }

  async checkBackend(): Promise<HealthResponse> {
    const backendHealth = await this.backend.check();

    return {
      status: backendHealth.status,
      // uptime: this.getUptime(),
      timestamp: new Date().toISOString(),
      services: {
        backend: backendHealth,
      },
    };
  }

  async checkSupabase(): Promise<HealthResponse> {
    const supabaseHealth = await this.supabase.check();

    return {
      status: supabaseHealth.status,
      // uptime: this.getUptime(),
      timestamp: new Date().toISOString(),
      services: {
        supabase: supabaseHealth,
      },
    };
  }

  async checkAll(): Promise<HealthResponse> {
    const [frontendHealth, backendHealth, supabaseHealth] =
      await Promise.allSettled([
        this.frontend.check(),
        this.backend.check(),
        this.supabase.check(),
      ]);

    const services = {
      frontend:
        frontendHealth.status === 'fulfilled'
          ? frontendHealth.value
          : {
              status: 'down' as const,
              responseTimeMs: 0,
              error: 'Check failed',
            },
      backend:
        backendHealth.status === 'fulfilled'
          ? backendHealth.value
          : {
              status: 'down' as const,
              responseTimeMs: 0,
              error: 'Check failed',
            },
      supabase:
        supabaseHealth.status === 'fulfilled'
          ? supabaseHealth.value
          : {
              status: 'down' as const,
              responseTimeMs: 0,
              error: 'Check failed',
            },
    };

    return {
      status: this.getOverallStatus(services),
      // uptime: this.getUptime(),
      timestamp: new Date().toISOString(),
      services,
    };
  }
}

export interface ServiceHealth {
  status: 'ok' | 'degraded' | 'down';
  responseTimeMs: number;
  error?: string;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  uptime: number;
  timestamp: string;
  services: Record<string, ServiceHealth>;
}

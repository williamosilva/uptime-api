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

export interface HealthCheckRecord {
  id?: string;
  timestamp: string;
  overall_status: string;
  uptime: number;
  frontend_status: string;
  frontend_response_time: number;
  frontend_error?: string;
  backend_status: string;
  backend_response_time: number;
  backend_error?: string;
  supabase_status: string;
  supabase_response_time: number;
  supabase_error?: string;
  created_at?: string;
}

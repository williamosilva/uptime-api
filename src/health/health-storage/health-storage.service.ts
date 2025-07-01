import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  HealthCheckRecord,
  HealthResponse,
} from 'src/health/types/health.types';

@Injectable()
export class HealthStorageService {
  private readonly logger = new Logger(HealthStorageService.name);
  private supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.error(
        'Supabase credentials not found in environment variables',
      );
      throw new Error('Supabase credentials missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.logger.log('Supabase client initialized for health check storage');
  }

  async saveHealthCheck(healthData: HealthResponse): Promise<void> {
    try {
      const record: HealthCheckRecord = {
        timestamp: healthData.timestamp,
        overall_status: healthData.status,
        // uptime: healthData.uptime,
        frontend_status: healthData.services.frontend?.status || 'unknown',
        frontend_response_time:
          healthData.services.frontend?.responseTimeMs || 0,
        frontend_error: healthData.services.frontend?.error,
        backend_status: healthData.services.backend?.status || 'unknown',
        backend_response_time: healthData.services.backend?.responseTimeMs || 0,
        backend_error: healthData.services.backend?.error,
        supabase_status: healthData.services.supabase?.status || 'unknown',
        supabase_response_time:
          healthData.services.supabase?.responseTimeMs || 0,
        supabase_error: healthData.services.supabase?.error,
      };

      const { error } = await this.supabase
        .from('health_checks')
        .insert([record]);

      if (error) {
        this.logger.error('Failed to save health check to Supabase:', error);
        throw error;
      }

      this.logger.log(
        `Health check saved successfully at ${healthData.timestamp}`,
      );
    } catch (error) {
      this.logger.error('Error saving health check:', error);
      throw error;
    }
  }

  async getRecentHealthChecks(
    limit: number = 50,
  ): Promise<HealthCheckRecord[]> {
    try {
      const { data, error } = await this.supabase
        .from('health_checks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        this.logger.error('Failed to fetch health checks:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      this.logger.error('Error fetching health checks:', error);
      throw error;
    }
  }

  async cleanupOldRecords(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await this.supabase
        .from('health_checks')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        this.logger.error('Failed to cleanup old health check records:', error);
        throw error;
      }

      this.logger.log(
        `Cleaned up health check records older than ${daysToKeep} days`,
      );
    } catch (error) {
      this.logger.error('Error during cleanup:', error);
      throw error;
    }
  }

  async getHealthChecksByDaysAgo(
    daysAgo: number,
  ): Promise<HealthCheckRecord[]> {
    try {
      // Calcula a data de início
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      startDate.setHours(0, 0, 0, 0);

      // Calcula a data de fim
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - daysAgo);
      endDate.setHours(23, 59, 59, 999);

      this.logger.log(
        `Fetching health checks for ${daysAgo} days ago (${startDate.toISOString()} to ${endDate.toISOString()})`,
      );

      const { data, error } = await this.supabase
        .from('health_checks')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        this.logger.error(
          `Failed to fetch health checks for ${daysAgo} days ago:`,
          error,
        );
        throw error;
      }

      this.logger.log(
        `Found ${data?.length || 0} health check records for ${daysAgo} days ago`,
      );

      return data || [];
    } catch (error) {
      this.logger.error(
        `Error fetching health checks for ${daysAgo} days ago:`,
        error,
      );
      throw error;
    }
  }

  async getHealthChecksByDateRange(
    startDaysAgo: number,
    endDaysAgo: number = 0,
  ): Promise<HealthCheckRecord[]> {
    try {
      // Data de início
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - startDaysAgo);
      startDate.setHours(0, 0, 0, 0);

      // Data de fim
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - endDaysAgo);
      endDate.setHours(23, 59, 59, 999);

      this.logger.log(
        `Fetching health checks from ${startDaysAgo} to ${endDaysAgo} days ago (${startDate.toISOString()} to ${endDate.toISOString()})`,
      );

      const { data, error } = await this.supabase
        .from('health_checks')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        this.logger.error(
          `Failed to fetch health checks for date range:`,
          error,
        );
        throw error;
      }

      this.logger.log(
        `Found ${data?.length || 0} health check records for the specified date range`,
      );

      return data || [];
    } catch (error) {
      this.logger.error(`Error fetching health checks for date range:`, error);
      throw error;
    }
  }
}

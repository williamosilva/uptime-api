import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { HealthStorageService } from './health-storage.service';
import { HealthService } from 'src/health/health.service';

@Injectable()
export class HealthCronService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(HealthCronService.name);
  private cronInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly intervalMs: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly healthService: HealthService,
    private readonly healthStorageService: HealthStorageService,
  ) {
    const intervalMinutes =
      this.configService.get<number>('HEALTH_CHECK_INTERVAL_MINUTES') || 5;
    this.intervalMs = intervalMinutes * 60 * 1000;

    this.logger.log(
      `Health check cron configured to run every ${intervalMinutes} minutes`,
    );
  }

  onModuleInit() {
    this.startCron();
    this.startCleanupCron();
  }

  onModuleDestroy() {
    this.stopCron();
    this.stopCleanupCron();
  }

  private startCron(): void {
    if (this.cronInterval) {
      clearInterval(this.cronInterval);
    }

    this.executeHealthCheck();

    this.cronInterval = setInterval(() => {
      this.executeHealthCheck();
    }, this.intervalMs);
  }

  private stopCron(): void {
    if (this.cronInterval) {
      clearInterval(this.cronInterval);
      this.cronInterval = null;
      this.logger.log('Health check cron job stopped');
    }
  }

  private startCleanupCron(): void {
    const cleanupIntervalMs = 24 * 60 * 60 * 1000;

    this.cleanupInterval = setInterval(() => {
      this.executeCleanup();
    }, cleanupIntervalMs);

    this.logger.log('Cleanup cron job started (runs daily)');
  }

  private stopCleanupCron(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      this.logger.log('Cleanup cron job stopped');
    }
  }

  private async executeHealthCheck(): Promise<void> {
    try {
      this.logger.log('Executing scheduled health check');

      const healthData = await this.healthService.checkAll();
      await this.healthStorageService.saveHealthCheck(healthData);

      this.logger.log(
        `Health check completed with overall status: ${healthData.status}`,
      );
    } catch (error) {
      this.logger.error('Failed to execute scheduled health check:', error);
    }
  }

  private async executeCleanup(): Promise<void> {
    try {
      this.logger.log('Executing cleanup of old health check records');

      const daysToKeep =
        this.configService.get<number>('HEALTH_CHECK_RETENTION_DAYS') || 30;
      await this.healthStorageService.cleanupOldRecords(daysToKeep);

      this.logger.log('Cleanup completed successfully');
    } catch (error) {
      this.logger.error('Failed to execute cleanup:', error);
    }
  }

  async executeManualCheck(): Promise<void> {
    await this.executeHealthCheck();
  }

  getCronStatus(): {
    isRunning: boolean;
    intervalMs: number;
    nextExecutionEstimate: string;
  } {
    return {
      isRunning: this.cronInterval !== null,
      intervalMs: this.intervalMs,
      nextExecutionEstimate: new Date(
        Date.now() + this.intervalMs,
      ).toISOString(),
    };
  }
}

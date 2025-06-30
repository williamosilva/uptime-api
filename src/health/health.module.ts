import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { FrontendHealthIndicator } from './indicators/frontend.health';
import { BackendHealthIndicator } from './indicators/backend.health';
import { SupabaseHealthIndicator } from './indicators/supabase.health';
import { HealthCronService } from 'src/health/health-storage/health-cron.service';
import { HealthStorageService } from 'src/health/health-storage/health-storage.service';

@Module({
  imports: [ConfigModule],
  controllers: [HealthController],
  providers: [
    HealthService,
    HealthCronService,
    HealthStorageService,
    FrontendHealthIndicator,
    BackendHealthIndicator,
    SupabaseHealthIndicator,
  ],
  exports: [HealthService, HealthCronService, HealthStorageService],
})
export class HealthModule {}

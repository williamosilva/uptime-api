import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { FrontendHealthIndicator } from './indicators/frontend.health';
import { BackendHealthIndicator } from './indicators/backend.health';
import { SupabaseHealthIndicator } from './indicators/supabase.health';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [TerminusModule, HttpModule, ConfigModule],
  controllers: [HealthController],
  providers: [
    HealthService,
    FrontendHealthIndicator,
    BackendHealthIndicator,
    SupabaseHealthIndicator,
  ],
})
export class HealthModule {}

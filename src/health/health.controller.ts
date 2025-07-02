import { Controller, Get, HttpStatus, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { HealthService } from './health.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponse } from './types/health.types';
import { HealthStorageService } from 'src/health/health-storage/health-storage.service';
import { HealthCronService } from 'src/health/health-storage/health-cron.service';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(
    private readonly healthService: HealthService,
    private readonly healthCronService: HealthCronService,
    private readonly healthStorageService: HealthStorageService,
  ) {}
  private setStatusCode(res: Response, healthResponse: HealthResponse): void {
    switch (healthResponse.status) {
      case 'ok':
        res.status(HttpStatus.OK);
        break;
      case 'degraded':
        res.status(HttpStatus.OK);
        break;
      case 'down':
        res.status(HttpStatus.SERVICE_UNAVAILABLE);
        break;
    }
  }

  @Get('frontend')
  @ApiOperation({ summary: 'Check Frontend health' })
  @ApiResponse({ status: 200, description: 'Frontend operational' })
  @ApiResponse({ status: 503, description: 'Frontend unavailable' })
  async checkFrontend(@Res() res: Response): Promise<void> {
    const health = await this.healthService.checkFrontend();
    this.setStatusCode(res, health);
    res.json(health);
  }

  @Get('backend')
  @ApiOperation({ summary: 'Check Backend health' })
  @ApiResponse({ status: 200, description: 'Operational backend' })
  async checkBackend(@Res() res: Response): Promise<void> {
    const health = await this.healthService.checkBackend();
    this.setStatusCode(res, health);
    res.json(health);
  }

  @Get('supabase')
  @ApiOperation({ summary: 'Check Supabase health' })
  @ApiResponse({ status: 200, description: 'Supabase operational' })
  @ApiResponse({ status: 503, description: 'Supabase unavailable' })
  async checkSupabase(@Res() res: Response): Promise<void> {
    const health = await this.healthService.checkSupabase();
    this.setStatusCode(res, health);
    res.json(health);
  }

  @Get()
  @ApiOperation({ summary: 'Check health of all services' })
  @ApiResponse({ status: 200, description: 'All services operational' })
  @ApiResponse({
    status: 503,
    description: 'One or more services unavailable',
  })
  async checkAll(@Res() res: Response): Promise<void> {
    const health = await this.healthService.checkAll();
    this.setStatusCode(res, health);
    res.json(health);
  }

  @Post('check-now')
  @ApiOperation({
    summary: 'Performs manual health check and saves to database',
  })
  @ApiResponse({ status: 200, description: 'Health check executed and saved' })
  async executeManualCheck(@Res() res: Response): Promise<void> {
    try {
      await this.healthCronService.executeManualCheck();
      res.status(HttpStatus.OK).json({
        success: true,
        message: 'Manual health check executed and saved successfully',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to execute manual health check',
      });
    }
  }

  @Get('cron-status')
  @ApiOperation({ summary: 'Get cron job status' })
  @ApiResponse({
    status: 200,
    description: 'Cron status successfully obtained',
  })
  async getCronStatus(@Res() res: Response): Promise<void> {
    const status = this.healthCronService.getCronStatus();
    res.status(HttpStatus.OK).json({
      success: true,
      data: status,
    });
  }

  @Get('history/last-days')
  @ApiOperation({
    summary: 'Get health checks from the last X days',
  })
  @ApiQuery({
    name: 'days',
    required: true,
    description:
      'Number of days to fetch (including today, e.g. 7 for last 7 days)',
    example: 7,
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description: 'Filter by specific component',
    enum: ['frontend', 'backend', 'supabase'],
    example: 'backend',
  })
  @ApiResponse({
    status: 200,
    description: 'Health checks from the specified period fetched successfully',
  })
  async getHealthChecksForLastDays(
    @Res() res: Response,
    @Query('days') days: string,
    @Query('filter') filter?: 'frontend' | 'backend' | 'supabase',
  ): Promise<void> {
    try {
      const lastDays = parseInt(days, 10);

      if (isNaN(lastDays) || lastDays < 1) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Days parameter must be a positive number greater than 0',
        });
        return;
      }

      if (filter && !['frontend', 'backend', 'supabase'].includes(filter)) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Filter must be one of: frontend, backend, supabase',
        });
        return;
      }

      const healthChecks =
        await this.healthStorageService.getHealthChecksForLastDays(
          lastDays,
          filter,
        );

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (lastDays - 1));
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      res.status(HttpStatus.OK).json({
        success: true,
        data: healthChecks,
        count: healthChecks.length,
        period: {
          days: lastDays,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
        filter: filter || 'all',
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch health checks for the specified period',
      });
    }
  }

  @Get('history/range')
  @ApiOperation({
    summary: 'Get health checks for a period (range of days)',
  })
  @ApiQuery({
    name: 'startDays',
    required: true,
    description: 'Start of period in days ago (ex: 30)',
    example: 30,
  })
  @ApiQuery({
    name: 'endDays',
    required: false,
    description: 'End of period in days ago (default: 0 = today)',
    example: 0,
  })
  @ApiQuery({
    name: 'filter',
    required: false,
    description: 'Filter by specific component',
    enum: ['frontend', 'backend', 'supabase'],
    example: 'frontend',
  })
  @ApiResponse({
    status: 200,
    description: 'Health checks for period successfully fetched',
  })
  async getHealthChecksByRange(
    @Res() res: Response,
    @Query('startDays') startDays: string,
    @Query('endDays') endDays?: string,
    @Query('filter') filter?: 'frontend' | 'backend' | 'supabase',
  ): Promise<void> {
    try {
      const startDaysAgo = parseInt(startDays, 10);
      const endDaysAgo = endDays ? parseInt(endDays, 10) : 0;

      if (isNaN(startDaysAgo) || startDaysAgo < 0) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'startDays parameter must be a positive number',
        });
        return;
      }

      if (isNaN(endDaysAgo) || endDaysAgo < 0) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'endDays parameter must be a positive number',
        });
        return;
      }

      if (startDaysAgo <= endDaysAgo) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'startDays must be greater than endDays',
        });
        return;
      }

      // Validar filtro se fornecido
      if (filter && !['frontend', 'backend', 'supabase'].includes(filter)) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Filter must be one of: frontend, backend, supabase',
        });
        return;
      }

      const healthChecks =
        await this.healthStorageService.getHealthChecksByDateRange(
          startDaysAgo,
          endDaysAgo,
          filter,
        );

      const startDate = new Date(
        Date.now() - startDaysAgo * 24 * 60 * 60 * 1000,
      );
      const endDate = new Date(Date.now() - endDaysAgo * 24 * 60 * 60 * 1000);

      res.status(HttpStatus.OK).json({
        success: true,
        data: healthChecks,
        count: healthChecks.length,
        filter: filter || 'all',
        period: {
          startDaysAgo,
          endDaysAgo,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch health checks for the specified range',
      });
    }
  }

  @Get('stats/last-days')
  @ApiOperation({
    summary: 'Get health check statistics for the last X days',
  })
  @ApiQuery({
    name: 'days',
    required: true,
    description: 'Number of days to calculate statistics (including today)',
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics calculated successfully',
  })
  async getHealthStatsForLastDays(
    @Res() res: Response,
    @Query('days') days: string,
  ): Promise<void> {
    try {
      const lastDays = parseInt(days, 10);

      if (isNaN(lastDays) || lastDays < 1) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Days parameter must be a positive number greater than 0',
        });
        return;
      }

      const healthChecks =
        await this.healthStorageService.getHealthChecksForLastDays(lastDays);

      const stats = {
        totalChecks: healthChecks.length,
        statusCounts: {
          ok: healthChecks.filter((check) => check.overall_status === 'ok')
            .length,
          degraded: healthChecks.filter(
            (check) => check.overall_status === 'degraded',
          ).length,
          down: healthChecks.filter((check) => check.overall_status === 'down')
            .length,
        },
        services: {
          frontend: {
            url:
              process.env.FRONTEND_URL_HEALTH_CHECK || 'http://localhost:3000',
            avgResponseTime:
              healthChecks.length > 0
                ? healthChecks.reduce(
                    (sum, check) => sum + (check.frontend_response_time || 0),
                    0,
                  ) / healthChecks.length
                : 0,
            uptime:
              healthChecks.length > 0
                ? (healthChecks.filter(
                    (check) => check.frontend_status === 'ok',
                  ).length /
                    healthChecks.length) *
                  100
                : 0,
          },
          backend: {
            url:
              process.env.BACKEND_URL_HEALTH_CHECK || 'http://localhost:4000',
            avgResponseTime:
              healthChecks.length > 0
                ? healthChecks.reduce(
                    (sum, check) => sum + (check.backend_response_time || 0),
                    0,
                  ) / healthChecks.length
                : 0,
            uptime:
              healthChecks.length > 0
                ? (healthChecks.filter((check) => check.backend_status === 'ok')
                    .length /
                    healthChecks.length) *
                  100
                : 0,
          },
          supabase: {
            url: process.env.SUPABASE_URL || 'https://supabase.com',
            avgResponseTime:
              healthChecks.length > 0
                ? healthChecks.reduce(
                    (sum, check) => sum + (check.supabase_response_time || 0),
                    0,
                  ) / healthChecks.length
                : 0,
            uptime:
              healthChecks.length > 0
                ? (healthChecks.filter(
                    (check) => check.supabase_status === 'ok',
                  ).length /
                    healthChecks.length) *
                  100
                : 0,
          },
        },
      };

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (lastDays - 1));
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date();
      endDate.setHours(23, 59, 59, 999);

      res.status(HttpStatus.OK).json({
        success: true,
        data: stats,
        period: {
          days: lastDays,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        },
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to calculate health check statistics',
      });
    }
  }
}

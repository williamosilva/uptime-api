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
  @ApiOperation({ summary: 'Verifica saúde do Frontend' })
  @ApiResponse({ status: 200, description: 'Frontend operacional' })
  @ApiResponse({ status: 503, description: 'Frontend indisponível' })
  async checkFrontend(@Res() res: Response): Promise<void> {
    const health = await this.healthService.checkFrontend();
    this.setStatusCode(res, health);
    res.json(health);
  }

  @Get('backend')
  @ApiOperation({ summary: 'Verifica saúde do Backend' })
  @ApiResponse({ status: 200, description: 'Backend operacional' })
  async checkBackend(@Res() res: Response): Promise<void> {
    const health = await this.healthService.checkBackend();
    this.setStatusCode(res, health);
    res.json(health);
  }

  @Get('supabase')
  @ApiOperation({ summary: 'Verifica saúde do Supabase' })
  @ApiResponse({ status: 200, description: 'Supabase operacional' })
  @ApiResponse({ status: 503, description: 'Supabase indisponível' })
  async checkSupabase(@Res() res: Response): Promise<void> {
    const health = await this.healthService.checkSupabase();
    this.setStatusCode(res, health);
    res.json(health);
  }

  @Get()
  @ApiOperation({ summary: 'Verifica saúde de todos os serviços' })
  @ApiResponse({ status: 200, description: 'Todos os serviços operacionais' })
  @ApiResponse({
    status: 503,
    description: 'Um ou mais serviços indisponíveis',
  })
  async checkAll(@Res() res: Response): Promise<void> {
    const health = await this.healthService.checkAll();
    this.setStatusCode(res, health);
    res.json(health);
  }

  @Get('history')
  @ApiOperation({ summary: 'Obtém histórico de health checks' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Número de registros (padrão: 50)',
  })
  @ApiResponse({ status: 200, description: 'Histórico obtido com sucesso' })
  async getHealthHistory(
    @Res() res: Response,
    @Query('limit') limit?: string,
  ): Promise<void> {
    try {
      const limitNumber = limit ? parseInt(limit, 10) : 50;
      const history =
        await this.healthStorageService.getRecentHealthChecks(limitNumber);
      res.status(HttpStatus.OK).json({
        success: true,
        data: history,
        count: history.length,
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch health check history',
      });
    }
  }

  @Post('check-now')
  @ApiOperation({ summary: 'Executa health check manual e salva no banco' })
  @ApiResponse({ status: 200, description: 'Health check executado e salvo' })
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
  @ApiOperation({ summary: 'Obtém status do cron job' })
  @ApiResponse({
    status: 200,
    description: 'Status do cron obtido com sucesso',
  })
  async getCronStatus(@Res() res: Response): Promise<void> {
    const status = this.healthCronService.getCronStatus();
    res.status(HttpStatus.OK).json({
      success: true,
      data: status,
    });
  }

  @Get('history/days-ago/:days')
  @ApiOperation({ summary: 'Obtém health checks de X dias atrás' })
  @ApiQuery({
    name: 'days',
    required: true,
    description: 'Número de dias atrás (ex: 7 para uma semana atrás)',
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'Health checks do dia especificado obtidos com sucesso',
  })
  async getHealthChecksByDaysAgo(
    @Res() res: Response,
    @Query('days') days: string,
  ): Promise<void> {
    try {
      const daysAgo = parseInt(days, 10);

      if (isNaN(daysAgo) || daysAgo < 0) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Days parameter must be a positive number',
        });
        return;
      }

      const healthChecks =
        await this.healthStorageService.getHealthChecksByDaysAgo(daysAgo);

      res.status(HttpStatus.OK).json({
        success: true,
        data: healthChecks,
        count: healthChecks.length,
        daysAgo,
        date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch health checks for the specified day',
      });
    }
  }

  @Get('history/range')
  @ApiOperation({
    summary: 'Obtém health checks de um período (range de dias)',
  })
  @ApiQuery({
    name: 'startDays',
    required: true,
    description: 'Início do período em dias atrás (ex: 30)',
    example: 30,
  })
  @ApiQuery({
    name: 'endDays',
    required: false,
    description: 'Fim do período em dias atrás (padrão: 0 = hoje)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Health checks do período obtidos com sucesso',
  })
  async getHealthChecksByRange(
    @Res() res: Response,
    @Query('startDays') startDays: string,
    @Query('endDays') endDays?: string,
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

      const healthChecks =
        await this.healthStorageService.getHealthChecksByDateRange(
          startDaysAgo,
          endDaysAgo,
        );

      const startDate = new Date(
        Date.now() - startDaysAgo * 24 * 60 * 60 * 1000,
      );
      const endDate = new Date(Date.now() - endDaysAgo * 24 * 60 * 60 * 1000);

      res.status(HttpStatus.OK).json({
        success: true,
        data: healthChecks,
        count: healthChecks.length,
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

  @Get('stats/days-ago/:days')
  @ApiOperation({
    summary: 'Obtém estatísticas de health checks de X dias atrás',
  })
  @ApiQuery({
    name: 'days',
    required: true,
    description: 'Número de dias atrás para calcular estatísticas',
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas calculadas com sucesso',
  })
  async getHealthStatsForDay(
    @Res() res: Response,
    @Query('days') days: string,
  ): Promise<void> {
    try {
      const daysAgo = parseInt(days, 10);

      if (isNaN(daysAgo) || daysAgo < 0) {
        res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          error: 'Days parameter must be a positive number',
        });
        return;
      }

      const healthChecks =
        await this.healthStorageService.getHealthChecksByDaysAgo(daysAgo);

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

      res.status(HttpStatus.OK).json({
        success: true,
        data: stats,
        daysAgo,
        date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to calculate health check statistics',
      });
    }
  }
}

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
}

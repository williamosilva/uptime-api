import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { HealthService } from './health.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponse } from './types/health.types';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

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
}

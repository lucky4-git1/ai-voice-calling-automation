import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgTenantGuard } from '../../common/guards/org-tenant.guard';

@ApiTags('Analytics & Reporting')
@Controller('analytics')
@UseGuards(JwtAuthGuard, OrgTenantGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get operational analytics, call volume trends, outcomes, and agent metrics' })
  async getOverview(@Req() req: any) {
    return this.analyticsService.getOverviewMetrics(req.orgId);
  }
}

import { Controller, Get, Patch, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgTenantGuard } from '../../common/guards/org-tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@callagent/shared';

@ApiTags('Billing & Usage')
@Controller('billing')
@UseGuards(JwtAuthGuard, OrgTenantGuard, RolesGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private billingService: BillingService) {}

  @Get()
  @ApiOperation({ summary: 'Get current subscription details, usage breakdown, and spend limits' })
  async getSummary(@Req() req: any) {
    return this.billingService.getBillingSummary(req.orgId);
  }

  @Patch('spend-limit')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update monthly spending safeguard limit' })
  async updateLimit(@Req() req: any, @Body() body: { monthlySpendLimitCents: number }) {
    return this.billingService.updateSpendLimit(req.orgId, body.monthlySpendLimitCents);
  }

  @Post('change-plan')
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Upgrade or downgrade subscription plan' })
  async changePlan(@Req() req: any, @Body() body: { plan: string }) {
    return this.billingService.changePlan(req.orgId, body.plan);
  }
}

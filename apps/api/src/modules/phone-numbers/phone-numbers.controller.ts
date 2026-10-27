import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PhoneNumbersService } from './phone-numbers.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgTenantGuard } from '../../common/guards/org-tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@callagent/shared';

@ApiTags('Phone Numbers')
@Controller('phone-numbers')
@UseGuards(JwtAuthGuard, OrgTenantGuard, RolesGuard)
@ApiBearerAuth()
export class PhoneNumbersController {
  constructor(private phoneService: PhoneNumbersService) {}

  @Get()
  @ApiOperation({ summary: 'List all telephone numbers owned by the organization' })
  async list(@Req() req: any) {
    return this.phoneService.listNumbers(req.orgId);
  }

  @Patch(':id/assign')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Assign an AI agent to handle inbound calls on this number' })
  async assign(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { agentId: string | null; friendlyName?: string },
  ) {
    return this.phoneService.assignAgent(req.orgId, id, body.agentId, body.friendlyName);
  }

  @Post('provision')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Provision a new phone number (dev sandbox or verified provider)' })
  async provision(@Req() req: any, @Body() body: { friendlyName: string }) {
    return this.phoneService.provisionMockNumber(req.orgId, body.friendlyName || 'Voice Inbound Line');
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Release or disconnect a telephone number' })
  async release(@Req() req: any, @Param('id') id: string) {
    return this.phoneService.releaseNumber(req.orgId, id);
  }
}

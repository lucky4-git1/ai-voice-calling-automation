import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgTenantGuard } from '../../common/guards/org-tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@callagent/shared';

@ApiTags('Integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard, OrgTenantGuard, RolesGuard)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(private integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all available and configured external service integrations' })
  async list(@Req() req: any) {
    return this.integrationsService.listIntegrations(req.orgId);
  }

  @Post(':provider/configure')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Configure API keys or credentials for a provider' })
  async configure(
    @Req() req: any,
    @Param('provider') provider: string,
    @Body() body: { credentials: Record<string, string>; config?: Record<string, any> },
  ) {
    return this.integrationsService.configureIntegration(req.orgId, provider.toUpperCase(), body.credentials, body.config);
  }

  @Post(':provider/test')
  @ApiOperation({ summary: 'Run a live connection test handshake with the provider' })
  async test(@Req() req: any, @Param('provider') provider: string) {
    return this.integrationsService.testConnection(req.orgId, provider.toUpperCase());
  }

  @Post(':provider/disconnect')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Disconnect an integration' })
  async disconnect(@Req() req: any, @Param('provider') provider: string) {
    return this.integrationsService.disconnect(req.orgId, provider.toUpperCase());
  }
}

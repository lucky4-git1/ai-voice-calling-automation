import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgTenantGuard } from '../../common/guards/org-tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, CreateCampaignSchema } from '@callagent/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Campaigns')
@Controller('campaigns')
@UseGuards(JwtAuthGuard, OrgTenantGuard, RolesGuard)
@ApiBearerAuth()
export class CampaignsController {
  constructor(private campaignsService: CampaignsService) {}

  @Get()
  @ApiOperation({ summary: 'List all campaigns for current organization' })
  async list(@Req() req: any) {
    return this.campaignsService.listCampaigns(req.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign details, recipient progress, and calls' })
  async getOne(@Req() req: any, @Param('id') id: string) {
    return this.campaignsService.getCampaign(req.orgId, id);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Create a new campaign with recipient contacts' })
  async create(
    @Req() req: any,
    @Body(new ZodValidationPipe(CreateCampaignSchema)) body: any,
  ) {
    return this.campaignsService.createCampaign(req.orgId, body);
  }

  @Post(':id/start')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Start or resume an outbound campaign' })
  async start(@Req() req: any, @Param('id') id: string) {
    return this.campaignsService.startCampaign(req.orgId, id);
  }

  @Post(':id/pause')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Pause an ongoing campaign immediately' })
  async pause(@Req() req: any, @Param('id') id: string) {
    return this.campaignsService.pauseCampaign(req.orgId, id);
  }

  @Post(':id/cancel')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel and terminate an active campaign' })
  async cancel(@Req() req: any, @Param('id') id: string) {
    return this.campaignsService.cancelCampaign(req.orgId, id);
  }
}

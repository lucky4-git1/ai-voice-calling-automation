import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgTenantGuard } from '../../common/guards/org-tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@callagent/shared';

@ApiTags('AI Agents')
@Controller('agents')
@UseGuards(JwtAuthGuard, OrgTenantGuard, RolesGuard)
@ApiBearerAuth()
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all agents belonging to the current organization' })
  async list(@Req() req: any) {
    return this.agentsService.listAgents(req.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an agent by ID with version history' })
  async getOne(@Req() req: any, @Param('id') id: string) {
    return this.agentsService.getAgent(req.orgId, id);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Create a new AI voice agent in draft state' })
  async create(@Req() req: any, @Body() body: any) {
    return this.agentsService.createAgent(req.orgId, req.user.id, body);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Update agent settings (creates a new version draft)' })
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.agentsService.updateAgent(req.orgId, id, body);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate agent configuration against production deployment rules' })
  async validate(@Req() req: any, @Param('id') id: string) {
    return this.agentsService.validateAgent(req.orgId, id);
  }

  @Post(':id/publish')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Publish agent and lock current version for live calls' })
  async publish(@Req() req: any, @Param('id') id: string) {
    return this.agentsService.publishAgent(req.orgId, id, req.user.id);
  }

  @Post(':id/duplicate')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Duplicate an existing agent' })
  async duplicate(@Req() req: any, @Param('id') id: string) {
    return this.agentsService.duplicateAgent(req.orgId, id, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Archive an agent' })
  async archive(@Req() req: any, @Param('id') id: string) {
    return this.agentsService.archiveAgent(req.orgId, id);
  }

  @Post(':id/simulate-turn')
  @ApiOperation({ summary: 'Simulate a single conversational turn in the playground' })
  async simulateTurn(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { message: string; history: Array<{ role: string; content: string }> },
  ) {
    return this.agentsService.simulateTurn(req.orgId, id, body.history || [], body.message);
  }
}

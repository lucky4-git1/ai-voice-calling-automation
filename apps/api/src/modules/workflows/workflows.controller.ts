import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowsService } from './workflows.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgTenantGuard } from '../../common/guards/org-tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, SaveWorkflowSchema } from '@callagent/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Visual Workflows')
@Controller('workflows')
@UseGuards(JwtAuthGuard, OrgTenantGuard, RolesGuard)
@ApiBearerAuth()
export class WorkflowsController {
  constructor(private workflowsService: WorkflowsService) {}

  @Get()
  @ApiOperation({ summary: 'List all visual workflows' })
  async list(@Req() req: any) {
    return this.workflowsService.listWorkflows(req.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow details and versions' })
  async getOne(@Req() req: any, @Param('id') id: string) {
    return this.workflowsService.getWorkflow(req.orgId, id);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Create a new visual workflow' })
  async create(@Req() req: any, @Body() body: { name: string; description?: string }) {
    return this.workflowsService.createWorkflow(req.orgId, body.name, body.description);
  }

  @Post(':id/definition')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Save and version workflow graph definition' })
  async saveDefinition(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { definition: any; publish?: boolean },
  ) {
    return this.workflowsService.saveDefinition(req.orgId, id, body.definition, body.publish);
  }

  @Post(':id/simulate')
  @ApiOperation({ summary: 'Simulate workflow node execution with step-by-step trace' })
  async simulate(@Req() req: any, @Param('id') id: string, @Body() body: { message: string }) {
    return this.workflowsService.simulateExecution(req.orgId, id, body.message || 'I want to book an appointment');
  }
}

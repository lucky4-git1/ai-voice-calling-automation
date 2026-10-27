import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ToolsService } from './tools.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgTenantGuard } from '../../common/guards/org-tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, ToolDefinitionSchema } from '@callagent/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Agent Tools & Actions')
@Controller('tools')
@UseGuards(JwtAuthGuard, OrgTenantGuard, RolesGuard)
@ApiBearerAuth()
export class ToolsController {
  constructor(private toolsService: ToolsService) {}

  @Get()
  @ApiOperation({ summary: 'List all business tools and functions registered for the organization' })
  async list(@Req() req: any) {
    return this.toolsService.listTools(req.orgId);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Register a new business action/tool' })
  async create(
    @Req() req: any,
    @Body(new ZodValidationPipe(ToolDefinitionSchema)) body: any,
  ) {
    return this.toolsService.createTool(req.orgId, body);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an existing tool definition' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.toolsService.updateTool(req.orgId, id, body);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a registered tool' })
  async delete(@Req() req: any, @Param('id') id: string) {
    return this.toolsService.deleteTool(req.orgId, id);
  }

  @Post('execute')
  @ApiOperation({ summary: 'Test or execute an approved tool with input payload' })
  async execute(
    @Req() req: any,
    @Body() body: { toolName: string; inputPayload: Record<string, any> },
  ) {
    return this.toolsService.executeTool(req.orgId, body.toolName, body.inputPayload || {});
  }
}

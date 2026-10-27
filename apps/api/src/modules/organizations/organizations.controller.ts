import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgTenantGuard } from '../../common/guards/org-tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@callagent/shared';

@ApiTags('Organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard, OrgTenantGuard, RolesGuard)
@ApiBearerAuth()
export class OrganizationsController {
  constructor(private orgsService: OrganizationsService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current organization details' })
  async getCurrent(@Req() req: any) {
    return this.orgsService.getOrganization(req.orgId);
  }

  @Patch('current')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update current organization settings' })
  async updateCurrent(@Req() req: any, @Body() body: any) {
    return this.orgsService.updateOrganization(req.orgId, body);
  }

  @Get('current/members')
  @ApiOperation({ summary: 'List organization members' })
  async listMembers(@Req() req: any) {
    return this.orgsService.listMembers(req.orgId);
  }

  @Post('current/members/invite')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Invite a new team member by email' })
  async inviteMember(@Req() req: any, @Body() body: { email: string; role: string }) {
    return this.orgsService.inviteMember(req.orgId, body.email, body.role);
  }

  @Delete('current/members/:id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a member from the organization' })
  async removeMember(@Req() req: any, @Param('id') id: string) {
    return this.orgsService.removeMember(req.orgId, id, req.user.id);
  }
}

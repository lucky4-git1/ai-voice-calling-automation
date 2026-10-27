import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgTenantGuard } from '../../common/guards/org-tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, CreateContactSchema, BulkImportContactsSchema } from '@callagent/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Contacts')
@Controller('contacts')
@UseGuards(JwtAuthGuard, OrgTenantGuard, RolesGuard)
@ApiBearerAuth()
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  @ApiOperation({ summary: 'List contacts with optional search and DNC filters' })
  async list(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('tag') tag?: string,
    @Query('suppressed') suppressed?: string,
  ) {
    return this.contactsService.listContacts(req.orgId, search, tag, suppressed === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contact details and call history' })
  async getOne(@Req() req: any, @Param('id') id: string) {
    return this.contactsService.getContact(req.orgId, id);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Create a single contact' })
  async create(
    @Req() req: any,
    @Body(new ZodValidationPipe(CreateContactSchema)) body: any,
  ) {
    return this.contactsService.createContact(req.orgId, body);
  }

  @Post('import')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Bulk import contacts with lawful consent verification' })
  async bulkImport(
    @Req() req: any,
    @Body(new ZodValidationPipe(BulkImportContactsSchema)) body: any,
  ) {
    return this.contactsService.bulkImport(req.orgId, body.contacts, body.defaultConsentSource);
  }

  @Patch(':id/suppression')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Toggle Do-Not-Call (DNC) suppression for a contact' })
  async toggleSuppression(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { suppress: boolean; reason?: string },
  ) {
    return this.contactsService.toggleDncSuppression(req.orgId, id, body.suppress, body.reason);
  }
}

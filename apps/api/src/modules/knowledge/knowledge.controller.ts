import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgTenantGuard } from '../../common/guards/org-tenant.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, IngestDocumentSchema } from '@callagent/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Knowledge Base')
@Controller('knowledge')
@UseGuards(JwtAuthGuard, OrgTenantGuard, RolesGuard)
@ApiBearerAuth()
export class KnowledgeController {
  constructor(private knowledgeService: KnowledgeService) {}

  @Get('bases')
  @ApiOperation({ summary: 'List all knowledge bases for the organization' })
  async listBases(@Req() req: any) {
    return this.knowledgeService.listKnowledgeBases(req.orgId);
  }

  @Get('bases/:id')
  @ApiOperation({ summary: 'Get knowledge base details and documents' })
  async getBase(@Req() req: any, @Param('id') id: string) {
    return this.knowledgeService.getKnowledgeBase(req.orgId, id);
  }

  @Post('bases')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Create a new knowledge base' })
  async createBase(@Req() req: any, @Body() body: { name: string; description?: string }) {
    return this.knowledgeService.createKnowledgeBase(req.orgId, body.name, body.description);
  }

  @Post('bases/:id/documents')
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.OPERATOR)
  @ApiOperation({ summary: 'Ingest and chunk a document into a knowledge base' })
  async ingestDocument(
    @Req() req: any,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(IngestDocumentSchema)) body: any,
  ) {
    return this.knowledgeService.ingestDocument(req.orgId, id, body);
  }

  @Get('bases/:id/search')
  @ApiOperation({ summary: 'Perform semantic / similarity search across knowledge chunks' })
  async search(@Req() req: any, @Param('id') id: string, @Query('q') query: string) {
    return this.knowledgeService.searchKnowledge(req.orgId, id, query || '');
  }

  @Delete('documents/:docId')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a document from a knowledge base' })
  async deleteDoc(@Req() req: any, @Param('docId') docId: string) {
    return this.knowledgeService.deleteDocument(req.orgId, docId);
  }
}

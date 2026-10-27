import { Controller, Get, Param, Query, UseGuards, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { CallsService } from './calls.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrgTenantGuard } from '../../common/guards/org-tenant.guard';

@ApiTags('Call History & Records')
@Controller('calls')
@UseGuards(JwtAuthGuard, OrgTenantGuard)
@ApiBearerAuth()
export class CallsController {
  constructor(private callsService: CallsService) {}

  @Get()
  @ApiOperation({ summary: 'List calls with status, direction, and agent filtering' })
  async list(
    @Req() req: any,
    @Query('agentId') agentId?: string,
    @Query('direction') direction?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.callsService.listCalls(req.orgId, {
      agentId,
      direction,
      status,
      search,
      limit: limit ? parseInt(limit, 10) : 25,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export organization call history to CSV format' })
  async exportCsv(@Req() req: any, @Res() res: Response) {
    const csvData = await this.callsService.exportCsv(req.orgId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=calls-export-${Date.now()}.csv`);
    return res.send(csvData);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full call detail with dual-track transcript, summary, and tool executions' })
  async getOne(@Req() req: any, @Param('id') id: string) {
    return this.callsService.getCallDetail(req.orgId, id);
  }
}

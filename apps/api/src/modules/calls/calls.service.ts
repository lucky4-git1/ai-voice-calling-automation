import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CallsService {
  constructor(private prisma: PrismaService) {}

  async listCalls(
    orgId: string,
    filters: {
      agentId?: string;
      direction?: string;
      status?: string;
      search?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { organizationId: orgId };

    if (filters.agentId) where.agentId = filters.agentId;
    if (filters.direction) where.direction = filters.direction;
    if (filters.status) where.status = filters.status;

    if (filters.search) {
      where.OR = [
        { fromNumber: { contains: filters.search } },
        { toNumber: { contains: filters.search } },
        { contact: { name: { contains: filters.search } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.call.findMany({
        where,
        include: {
          agent: { select: { id: true, name: true } },
          contact: { select: { id: true, name: true, email: true, company: true } },
          summary: true,
          _count: { select: { segments: true, toolExecutions: true } },
        },
        orderBy: { startedAt: 'desc' },
        take: filters.limit || 25,
        skip: filters.offset || 0,
      }),
      this.prisma.call.count({ where }),
    ]);

    return {
      items,
      total,
      limit: filters.limit || 25,
      offset: filters.offset || 0,
    };
  }

  async getCallDetail(orgId: string, callId: string) {
    const call = await this.prisma.call.findFirst({
      where: { id: callId, organizationId: orgId },
      include: {
        agent: true,
        agentVersion: true,
        contact: true,
        campaign: true,
        segments: {
          orderBy: { timestampOffsetMs: 'asc' },
        },
        summary: true,
        toolExecutions: {
          orderBy: { createdAt: 'asc' },
        },
        usageEvents: true,
      },
    });

    if (!call) throw new NotFoundException('Call record not found');

    return {
      ...call,
      summary: call.summary ? {
        ...call.summary,
        keyTopics: JSON.parse(call.summary.keyTopics || '[]'),
        actionItems: JSON.parse(call.summary.actionItems || '[]'),
        extractedFields: JSON.parse(call.summary.extractedFields || '{}'),
      } : null,
      toolExecutions: call.toolExecutions.map((te) => ({
        ...te,
        inputPayload: JSON.parse(te.inputPayload || '{}'),
        outputPayload: JSON.parse(te.outputPayload || '{}'),
      })),
    };
  }

  async exportCsv(orgId: string) {
    const calls = await this.prisma.call.findMany({
      where: { organizationId: orgId },
      include: { agent: true, contact: true, summary: true },
      orderBy: { startedAt: 'desc' },
      take: 1000,
    });

    const header = 'Call ID,Started At,Direction,Status,From,To,Duration (s),Cost ($),Agent,Contact Name,Sentiment,Intent\n';
    const rows = calls.map((c) => {
      const started = c.startedAt.toISOString();
      const cost = (c.costMinorUnits / 100).toFixed(2);
      const agent = c.agent?.name?.replace(/,/g, '') || '';
      const contact = c.contact?.name?.replace(/,/g, '') || '';
      const intent = (c.summary?.customerIntent || '').replace(/,/g, ' ');
      return `${c.id},${started},${c.direction},${c.status},"${c.fromNumber}","${c.toNumber}",${c.durationSeconds},${cost},"${agent}","${contact}",${c.sentiment},"${intent}"`;
    }).join('\n');

    return header + rows;
  }
}

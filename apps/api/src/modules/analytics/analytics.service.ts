import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverviewMetrics(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        _count: {
          select: {
            calls: true,
            agents: true,
            contacts: true,
            campaigns: true,
            phoneNumbers: true,
          },
        },
      },
    });

    const calls = await this.prisma.call.findMany({
      where: { organizationId: orgId },
      include: {
        agent: { select: { id: true, name: true } },
      },
      orderBy: { startedAt: 'asc' },
    });

    const totalCalls = calls.length;
    const completedCalls = calls.filter((c) => c.status === 'COMPLETED').length;
    const transferredCalls = calls.filter((c) => c.status === 'TRANSFERRED').length;
    const totalDurationSeconds = calls.reduce((acc, c) => acc + c.durationSeconds, 0);
    const avgDurationSeconds = totalCalls > 0 ? Math.round(totalDurationSeconds / totalCalls) : 0;
    const answerRate = totalCalls > 0 ? Math.round(((completedCalls + transferredCalls) / totalCalls) * 100) : 0;
    const totalMinutes = Math.round(totalDurationSeconds / 60);

    // Call outcomes breakdown
    const outcomeCounts: Record<string, number> = {};
    for (const c of calls) {
      outcomeCounts[c.status] = (outcomeCounts[c.status] || 0) + 1;
    }

    // Sentiment breakdown
    const sentimentCounts: Record<string, number> = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };
    for (const c of calls) {
      const s = c.sentiment || 'NEUTRAL';
      sentimentCounts[s] = (sentimentCounts[s] || 0) + 1;
    }

    // Time-series volume (e.g. grouped by date)
    const volumeByDay: Record<string, { date: string; calls: number; minutes: number; cost: number }> = {};
    for (const c of calls) {
      const day = c.startedAt.toISOString().split('T')[0];
      if (!volumeByDay[day]) {
        volumeByDay[day] = { date: day, calls: 0, minutes: 0, cost: 0 };
      }
      volumeByDay[day].calls++;
      volumeByDay[day].minutes += Math.round(c.durationSeconds / 60);
      volumeByDay[day].cost += c.costMinorUnits / 100;
    }

    // Agent ranking
    const agentStats: Record<string, { agentId: string; name: string; calls: number; avgDuration: number; totalCost: number }> = {};
    for (const c of calls) {
      if (!c.agentId || !c.agent) continue;
      if (!agentStats[c.agentId]) {
        agentStats[c.agentId] = {
          agentId: c.agentId,
          name: c.agent.name,
          calls: 0,
          avgDuration: 0,
          totalCost: 0,
        };
      }
      agentStats[c.agentId].calls++;
      agentStats[c.agentId].avgDuration += c.durationSeconds;
      agentStats[c.agentId].totalCost += c.costMinorUnits / 100;
    }

    const agentRankings = Object.values(agentStats).map((a) => ({
      ...a,
      avgDuration: a.calls > 0 ? Math.round(a.avgDuration / a.calls) : 0,
      totalCost: parseFloat(a.totalCost.toFixed(2)),
    }));

    return {
      summary: {
        totalCalls,
        successfulCalls: completedCalls,
        transferredCalls,
        answerRate,
        avgDurationSeconds,
        totalMinutesConsumed: totalMinutes,
        currentSpendCents: org?.currentSpendCents || 0,
        monthlySpendLimitCents: org?.monthlySpendLimitCents || 10000,
        activeAgentsCount: org?._count.agents || 0,
        activeCampaignsCount: org?._count.campaigns || 0,
        totalContactsCount: org?._count.contacts || 0,
        phoneNumbersCount: org?._count.phoneNumbers || 0,
      },
      outcomeDistribution: outcomeCounts,
      sentimentDistribution: sentimentCounts,
      volumeTrends: Object.values(volumeByDay),
      agentRankings,
    };
  }
}

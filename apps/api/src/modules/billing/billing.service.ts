import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionTier } from '@callagent/shared';

@Injectable()
export class BillingService {
  constructor(private prisma: PrismaService) {}

  async getBillingSummary(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscriptions: { where: { status: 'ACTIVE' }, take: 1 },
      },
    });

    if (!org) throw new NotFoundException('Organization not found');

    const subscription = org.subscriptions[0] || {
      tier: 'STARTER',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    };

    // Calculate usage aggregates by category
    const usageEvents = await this.prisma.usageEvent.findMany({
      where: { organizationId: orgId },
    });

    let telephonySeconds = 0;
    let sttMinutes = 0;
    let ttsCharacters = 0;
    let llmTokens = 0;
    let calculatedCostCents = 0;

    for (const ev of usageEvents) {
      calculatedCostCents += ev.costMinorUnits;
      if (ev.eventType === 'TELEPHONY_SECONDS') telephonySeconds += ev.quantity;
      if (ev.eventType === 'STT_MINUTES') sttMinutes += ev.quantity;
      if (ev.eventType === 'TTS_CHARACTERS') ttsCharacters += ev.quantity;
      if (ev.eventType === 'LLM_TOKENS') llmTokens += ev.quantity;
    }

    const planAllowances: Record<string, { includedMinutes: number; concurrencyLimit: number; priceMonthly: number }> = {
      STARTER: { includedMinutes: 300, concurrencyLimit: 3, priceMonthly: 49 },
      PROFESSIONAL: { includedMinutes: 1500, concurrencyLimit: 15, priceMonthly: 199 },
      ENTERPRISE: { includedMinutes: 10000, concurrencyLimit: 100, priceMonthly: 899 },
    };

    const currentPlanConfig = planAllowances[org.plan] || planAllowances.STARTER;

    return {
      plan: org.plan,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      monthlySpendLimitCents: org.monthlySpendLimitCents,
      currentSpendCents: org.currentSpendCents,
      planConfig: currentPlanConfig,
      usage: {
        telephonyMinutes: Math.round(telephonySeconds / 60),
        sttMinutes: parseFloat(sttMinutes.toFixed(1)),
        ttsCharacters: Math.round(ttsCharacters),
        llmTokens: Math.round(llmTokens),
        totalEventsCount: usageEvents.length,
      },
      invoices: [
        {
          id: 'inv_oct2026_01',
          date: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
          amount: currentPlanConfig.priceMonthly,
          currency: 'USD',
          status: 'PAID',
          pdfUrl: 'https://billing.callagent.internal/invoices/inv_oct2026_01.pdf',
        },
      ],
    };
  }

  async updateSpendLimit(orgId: string, monthlySpendLimitCents: number) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data: { monthlySpendLimitCents },
    });
  }

  async changePlan(orgId: string, plan: string) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data: { plan },
    });
  }
}

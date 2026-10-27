import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCampaignInput, CampaignStatus, CampaignRecipientStatus } from '@callagent/shared';
import { VoiceOrchestratorService } from '../voice-runtime/voice-orchestrator.service';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private prisma: PrismaService,
    private voiceOrchestrator: VoiceOrchestratorService,
  ) {}

  async listCampaigns(orgId: string) {
    return this.prisma.campaign.findMany({
      where: { organizationId: orgId },
      include: {
        agent: { select: { id: true, name: true } },
        _count: { select: { recipients: true, calls: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaign(orgId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, organizationId: orgId },
      include: {
        agent: true,
        recipients: {
          include: { contact: true },
          take: 50,
        },
        calls: {
          orderBy: { startedAt: 'desc' },
          take: 10,
          include: { summary: true },
        },
      },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async createCampaign(orgId: string, dto: CreateCampaignInput) {
    // 1. Verify Agent
    const agent = await this.prisma.agent.findFirst({
      where: { id: dto.agentId, organizationId: orgId },
    });

    if (!agent) throw new BadRequestException('Specified agent not found');

    // 2. Fetch Contacts & Filter out DNC
    const contacts = await this.prisma.contact.findMany({
      where: {
        id: { in: dto.contactIds },
        organizationId: orgId,
      },
    });

    if (contacts.length === 0) {
      throw new BadRequestException('No valid contacts selected');
    }

    // 3. Fetch Organization Suppression List
    const suppressions = await this.prisma.suppressionEntry.findMany({
      where: { organizationId: orgId },
    });
    const suppressedSet = new Set(suppressions.map((s) => s.phoneNumber));

    return this.prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.create({
        data: {
          organizationId: orgId,
          name: dto.name,
          description: dto.description || '',
          agentId: dto.agentId,
          callerIdNumber: dto.callerIdNumber,
          status: CampaignStatus.DRAFT,
          concurrencyLimit: dto.concurrencyLimit || 5,
          maxRetries: dto.maxRetriesPerContact || 1,
          windowStart: dto.callingWindowStart || '09:00',
          windowEnd: dto.callingWindowEnd || '18:00',
          timezoneEnforcement: dto.timezoneEnforcement || 'RECIPIENT_LOCAL',
          budgetLimitCents: dto.budgetLimitCents,
          totalRecipients: contacts.length,
        },
      });

      for (const contact of contacts) {
        const isDnc = contact.isDncSuppressed || suppressedSet.has(contact.phoneNumber);
        await tx.campaignRecipient.create({
          data: {
            campaignId: campaign.id,
            contactId: contact.id,
            phoneNumber: contact.phoneNumber,
            status: isDnc ? CampaignRecipientStatus.SUPPRESSED : CampaignRecipientStatus.PENDING,
            resultOutcome: isDnc ? 'SUPPRESSED_BY_DNC_POLICY' : null,
          },
        });
      }

      return campaign;
    });
  }

  async startCampaign(orgId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, organizationId: orgId },
    });

    if (!campaign) throw new NotFoundException('Campaign not found');

    // Calling window check
    const now = new Date();
    const currentHourMin = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}`;
    
    // Spend limit check
    const org = await this.prisma.organization.findUnique({ where: { id: orgId } });
    if (org && org.currentSpendCents >= org.monthlySpendLimitCents) {
      throw new ForbiddenException('Cannot start campaign: Organization monthly spend limit reached.');
    }

    const updated = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.RUNNING,
        startedAt: campaign.startedAt || new Date(),
      },
    });

    // Asynchronously dispatch the first batch of calls according to concurrencyLimit
    this.processCampaignBatch(campaignId);

    return updated;
  }

  async pauseCampaign(orgId: string, campaignId: string) {
    return this.prisma.campaign.updateMany({
      where: { id: campaignId, organizationId: orgId },
      data: { status: CampaignStatus.PAUSED },
    });
  }

  async cancelCampaign(orgId: string, campaignId: string) {
    return this.prisma.campaign.updateMany({
      where: { id: campaignId, organizationId: orgId },
      data: {
        status: CampaignStatus.CANCELLED,
        completedAt: new Date(),
      },
    });
  }

  // Safe background worker batch processing
  private async processCampaignBatch(campaignId: string) {
    try {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { agent: true },
      });

      if (!campaign || campaign.status !== CampaignStatus.RUNNING) return;

      // Find pending recipients up to concurrencyLimit
      const pendingRecipients = await this.prisma.campaignRecipient.findMany({
        where: {
          campaignId,
          status: CampaignRecipientStatus.PENDING,
        },
        take: campaign.concurrencyLimit,
      });

      if (pendingRecipients.length === 0) {
        // Campaign finished
        await this.prisma.campaign.update({
          where: { id: campaignId },
          data: {
            status: CampaignStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
        return;
      }

      for (const recipient of pendingRecipients) {
        try {
          // Mark DIALING
          await this.prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: { status: CampaignRecipientStatus.DIALING },
          });

          // Initiate call via voice orchestrator
          const callResult = await this.voiceOrchestrator.initiateOutboundCall(
            campaign.organizationId,
            campaign.agentId,
            recipient.phoneNumber,
            campaign.callerIdNumber,
            campaign.id,
          );

          // Update recipient as COMPLETED or ANSWERED
          await this.prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: CampaignRecipientStatus.COMPLETED,
              lastCallId: callResult.callId,
              resultOutcome: 'CALL_ANSWERED_AND_EXECUTED',
            },
          });

          await this.prisma.campaign.update({
            where: { id: campaignId },
            data: { successfulCalls: { increment: 1 } },
          });
        } catch (callErr: any) {
          this.logger.error(`Failed dialing recipient ${recipient.phoneNumber}: ${callErr.message}`);
          await this.prisma.campaignRecipient.update({
            where: { id: recipient.id },
            data: {
              status: CampaignRecipientStatus.FAILED,
              resultOutcome: callErr.message,
            },
          });
          await this.prisma.campaign.update({
            where: { id: campaignId },
            data: { failedCalls: { increment: 1 } },
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`Error in campaign batch processor: ${err.message}`);
    }
  }
}

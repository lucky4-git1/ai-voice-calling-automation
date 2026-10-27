import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PhoneNumbersService {
  constructor(private prisma: PrismaService) {}

  async listNumbers(orgId: string) {
    return this.prisma.phoneNumber.findMany({
      where: { organizationId: orgId },
      include: {
        agent: {
          select: { id: true, name: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignAgent(orgId: string, numberId: string, agentId: string | null, friendlyName?: string) {
    const record = await this.prisma.phoneNumber.findFirst({
      where: { id: numberId, organizationId: orgId },
    });

    if (!record) {
      throw new NotFoundException('Phone number not found');
    }

    if (agentId) {
      const agent = await this.prisma.agent.findFirst({
        where: { id: agentId, organizationId: orgId },
      });
      if (!agent) throw new BadRequestException('Agent not found');
    }

    return this.prisma.phoneNumber.update({
      where: { id: numberId },
      data: {
        activeAgentId: agentId,
        friendlyName: friendlyName ?? record.friendlyName,
      },
      include: { agent: true },
    });
  }

  async provisionMockNumber(orgId: string, friendlyName: string) {
    const randomSuffix = Math.floor(1000000 + Math.random() * 9000000);
    const number = `+1555${randomSuffix}`;

    return this.prisma.phoneNumber.create({
      data: {
        organizationId: orgId,
        number,
        friendlyName,
        provider: 'MOCK_DEV',
        status: 'ACTIVE',
        capabilities: JSON.stringify({ voice: true, sms: true, sip: true }),
      },
    });
  }

  async releaseNumber(orgId: string, numberId: string) {
    const record = await this.prisma.phoneNumber.findFirst({
      where: { id: numberId, organizationId: orgId },
    });

    if (!record) throw new NotFoundException('Phone number not found');

    return this.prisma.phoneNumber.delete({
      where: { id: numberId },
    });
  }
}

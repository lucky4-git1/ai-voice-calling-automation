import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@callagent/shared';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async getOrganization(orgId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        subscriptions: { where: { status: 'ACTIVE' }, take: 1 },
        _count: {
          select: {
            memberships: true,
            agents: true,
            phoneNumbers: true,
            contacts: true,
            campaigns: true,
            calls: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async updateOrganization(orgId: string, data: { name?: string; timezone?: string; monthlySpendLimitCents?: number }) {
    return this.prisma.organization.update({
      where: { id: orgId },
      data,
    });
  }

  async listMembers(orgId: string) {
    return this.prisma.organizationMembership.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async inviteMember(orgId: string, email: string, role: string) {
    const normalizedEmail = email.toLowerCase();
    
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      const existingMembership = await this.prisma.organizationMembership.findUnique({
        where: {
          userId_organizationId: {
            userId: existingUser.id,
            organizationId: orgId,
          },
        },
      });

      if (existingMembership) {
        throw new BadRequestException('User is already a member of this organization');
      }

      // Add directly
      return this.prisma.organizationMembership.create({
        data: {
          organizationId: orgId,
          userId: existingUser.id,
          role: role || UserRole.MEMBER,
        },
        include: { user: true },
      });
    }

    // Create an invitation record with token
    const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    return this.prisma.invitation.create({
      data: {
        organizationId: orgId,
        email: normalizedEmail,
        role: role || UserRole.MEMBER,
        token,
        expiresAt,
      },
    });
  }

  async removeMember(orgId: string, membershipId: string, currentUserId: string) {
    const membership = await this.prisma.organizationMembership.findUnique({
      where: { id: membershipId },
    });

    if (!membership || membership.organizationId !== orgId) {
      throw new NotFoundException('Membership record not found');
    }

    if (membership.userId === currentUserId && membership.role === 'OWNER') {
      throw new ForbiddenException('The owner cannot remove themselves from their organization');
    }

    return this.prisma.organizationMembership.delete({
      where: { id: membershipId },
    });
  }
}

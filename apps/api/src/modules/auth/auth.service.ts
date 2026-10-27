import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterInput, LoginInput } from '@callagent/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterInput) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email address already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const slug = dto.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `org-${Date.now()}`;

    // Transaction to create User, Organization, and Owner Membership
    const result = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
          plan: 'STARTER',
          monthlySpendLimitCents: 10000,
        },
      });

      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.name,
          emailVerified: true,
          memberships: {
            create: {
              organizationId: org.id,
              role: 'OWNER',
            },
          },
        },
      });

      // Default mock phone number for instant onboarding test calls
      await tx.phoneNumber.create({
        data: {
          organizationId: org.id,
          number: `+1555${Math.floor(1000000 + Math.random() * 9000000)}`,
          friendlyName: 'Default Testing Sandbox Number',
          provider: 'MOCK_DEV',
          status: 'ACTIVE',
          capabilities: JSON.stringify({ voice: true, sms: false, sip: true }),
        },
      });

      // Initialize free starter subscription
      await tx.subscription.create({
        data: {
          organizationId: org.id,
          tier: 'STARTER',
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        },
      });

      return { user, org };
    });

    const token = this.generateToken(result.user.id, result.user.email);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      organization: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
        role: 'OWNER',
      },
      accessToken: token,
    };
  }

  async login(dto: LoginInput) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateToken(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
        plan: m.organization.plan,
      })),
      activeOrganization: user.memberships[0] ? {
        id: user.memberships[0].organization.id,
        name: user.memberships[0].organization.name,
        slug: user.memberships[0].organization.slug,
        role: user.memberships[0].role,
        plan: user.memberships[0].organization.plan,
      } : null,
      accessToken: token,
    };
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({
      sub: userId,
      email,
    });
  }
}

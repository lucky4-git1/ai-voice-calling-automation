import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrgTenantGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('User session required');
    }

    // Determine target organization ID
    let orgId = req.headers['x-organization-id'] || req.params?.orgId || req.query?.orgId;

    if (!orgId) {
      // Fallback to user's first organization
      const defaultMembership = await this.prisma.organizationMembership.findFirst({
        where: { userId: user.id },
        include: { organization: true },
      });

      if (!defaultMembership) {
        throw new NotFoundException('User is not associated with any organization');
      }

      orgId = defaultMembership.organizationId;
      req.organization = defaultMembership.organization;
      req.orgRole = defaultMembership.role;
      req.orgId = orgId;
      return true;
    }

    // Explicit verification of organization membership
    const membership = await this.prisma.organizationMembership.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: String(orgId),
        },
      },
      include: {
        organization: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Access denied: You are not a member of this organization');
    }

    req.organization = membership.organization;
    req.orgRole = membership.role;
    req.orgId = orgId;
    return true;
  }
}

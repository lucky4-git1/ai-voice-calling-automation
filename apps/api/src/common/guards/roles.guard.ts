import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@callagent/shared';

const ROLE_HIERARCHY: Record<string, number> = {
  [UserRole.OWNER]: 100,
  [UserRole.ADMIN]: 80,
  [UserRole.OPERATOR]: 60,
  [UserRole.ANALYST]: 40,
  [UserRole.MEMBER]: 20,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const userRole = req.orgRole || req.user?.role;

    if (!userRole) {
      throw new ForbiddenException('Insufficient role privileges');
    }

    const userWeight = ROLE_HIERARCHY[userRole] || 0;
    const isAuthorized = requiredRoles.some((role) => {
      const requiredWeight = ROLE_HIERARCHY[role] || 0;
      return userWeight >= requiredWeight;
    });

    if (!isAuthorized) {
      throw new ForbiddenException(`Action requires one of the following roles: ${requiredRoles.join(', ')}`);
    }

    return true;
  }
}

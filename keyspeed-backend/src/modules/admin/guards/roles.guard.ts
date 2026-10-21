import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles specified on an endpoint guarded by RolesGuard, default to requiring 'admin'
    const rolesToCheck = requiredRoles && requiredRoles.length > 0 ? requiredRoles : ['admin'];

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.isBanned) {
      throw new ForbiddenException('Your account has been banned');
    }

    const hasRole = rolesToCheck.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException('Forbidden resource: Admin access required');
    }

    return true;
  }
}


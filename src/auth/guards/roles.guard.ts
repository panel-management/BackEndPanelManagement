import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserPayload } from '../interfaces/user-payload.interface';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: UserPayload = request.user;

    if (!user || user.type === undefined) {
      throw new HttpException('شما دسترسی لازم برای این بخش را ندارید', HttpStatus.FORBIDDEN);
    }

    const hasRole = () => requiredRoles.some((role) => user.type === role);

    if (hasRole()) {
      return true;
    }

    throw new HttpException('شما دسترسی لازم برای این بخش را ندارید', HttpStatus.FORBIDDEN);
  }
}

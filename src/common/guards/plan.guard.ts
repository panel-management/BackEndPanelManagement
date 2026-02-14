import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { UsersService } from "src/users/users.service";

@Injectable()
export class PlanGuard implements CanActivate {
    constructor(private readonly users: UsersService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.userId) {
            return true;
        }

        const planStatus = await this.users.getPlanStatus(user.userId);

        if (planStatus?.isAdmin) {
            return true;
        }

        if (!planStatus?.isActive) {
            throw new HttpException(planStatus?.message ?? 'اشتراک شما فعال نیست', HttpStatus.PAYMENT_REQUIRED);
        }

        return true
    }
}
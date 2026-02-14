import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Role } from "src/auth/enums/role.enum";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class ActiveUserGuard implements CanActivate {
    constructor(private readonly prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user

        if (!user || !user.userId) {
            return true;
        }

        const StatusUser = await this.prisma.users.findUnique({
            where: { user_id: user.userId },
            select: { isActive: true }
        })

        if (!StatusUser || StatusUser.isActive === false) {
            let message: string = 'حساب کاربری شما غیرفعال شده است';

            if (user.type === Role.Master) {
                message = 'حساب کاربری شما غیرفعال شده است. لطفاً به ادمین سایت اطلاع دهید';
            } else if (user.type === Role.Coach || user.type === Role.Student) {
                message = 'حساب کاربری شما غیرفعال شده است. لطفاً به مدیر باشگاه اطلاع دهید';
            }
            throw new HttpException(message, HttpStatus.FORBIDDEN);
        }

        return true;
    }
}
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentService: PaymentsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Master, Role.Admin)
  @HttpCode(HttpStatus.OK)
  getAllUsers(@Req() req) {
    const masterId = req.user.userId;
    return this.paymentService.findAll(masterId);
  }
}

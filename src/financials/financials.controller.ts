import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FinancialsService } from './financials.service';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { CreatePlanDto } from './dto/create-plan.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { CreateSubscriptionPaymentDto } from './dto/create-subscription-payment.dto';
import { ReviewSubscriptionPaymentDto } from './dto/review-subscription-payment.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('financials')
@UseGuards(RolesGuard)
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  // Create plan design payment
  @Post('plans')
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.CREATED)
  createPlan(@Body() createPlanDto: CreatePlanDto) {
    return this.financialsService.createPlan(createPlanDto);
  }

  // Get all plans payment
  @Get('plans')
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.OK)
  findAllPlans() {
    return this.financialsService.findAllPlans();
  }

  // Register equipment transaction
  @Post('transactions/equipment')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.CREATED)
  createEquipmentTransaction(
    @Req() req,
    @Body() createEquipmentDto: CreateEquipmentDto,
  ) {
    return this.financialsService.createEquipmentTransaction(
      req.user.userId,
      createEquipmentDto,
    );
  }

  // Confirms a manual payment
  @Put('transactions/:id/confirm')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  confirmPayment(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() confirmPaymentDto: ConfirmPaymentDto,
  ) {
    return this.financialsService.confirmManualPayment(
      id,
      req.user.userId,
      confirmPaymentDto,
    );
  }

  // Transactions history
  @Get('transactions/my')
  @Roles(Role.Master, Role.Student)
  @HttpCode(HttpStatus.OK)
  getMyTransactions(@Req() req) {
    return this.financialsService.getStudentTransactions(req.user.userId);
  }

  // Returns the financial dashboard and debtor list for master
  @Get('dashboard/master')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getMasterDashboard() {
    return this.financialsService.getMasterDashboard();
  }

  // Returns the financial dashboard and debtor list for admin
  @Get('dashboard/admin')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  getAdminDashboard() {
    return this.financialsService.getAdminDashboard();
  }

  // The deposit slip records the plan
  @Post('subscriptions')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('imageFile'))
  createSubscriptionPayment(
    @Req() req,
    @Body() createSubscriptionPaymentDto: CreateSubscriptionPaymentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.financialsService.createSubscriptionPayment(
      req.user.userId,
      createSubscriptionPaymentDto,
      file,
    );
  }

  // Returns the pending payment plan
  @Get('subscriptions/pending')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  getPendingSubscription() {
    return this.financialsService.getAllPendingSubscriptions();
  }

  // Master See the history of your plan payments
  @Get('subscriptions/history')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getMySubscriptionHistory(@Req() req) {
    return this.financialsService.getMasterSubscriptionHistory(req.user.userId);
  }

  // Admin confirms the master's plan payment
  @Put('subscriptions/:id/review')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  reviewSubscriptionPayment(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewDto: ReviewSubscriptionPaymentDto,
  ) {
    return this.financialsService.reviewSubscriptionPayment(
      id,
      req.user.userId,
      reviewDto,
    );
  }
}

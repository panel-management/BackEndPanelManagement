import {
  Body,
  Controller,
  Delete,
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
import { CreateMasterPlanDto } from 'src/users/master/dto/create-master-plan.dto';
import { UpdateMasterPlanDto } from 'src/users/master/dto/update-master-plan.dto';
import { Request } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdatePlanDto } from './dto/update-plan.dto';

interface RequestWithUser extends Request {
  user: {
    user_id: number;
    type: Role;
    fullName: string;
  };
}

@Controller('financials')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  // Create plan design payment
  @Post('plans')
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.CREATED)
  createPlan(@Req() req, @Body() createPlanDto: CreatePlanDto) {
    return this.financialsService.createPlanStudent(
      req.user.userId,
      createPlanDto,
    );
  }

  // Get all plans payment
  @Get('plans')
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.OK)
  findAllPlans(@Req() req) {
    return this.financialsService.findAllPlans(req.user.userId);
  }

  // Update Plan Student Payment
  @Put('plans/:id')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  updatePlanStudent(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return this.financialsService.updatePlanStudent(
      id,
      req.user.userId,
      updatePlanDto,
    );
  }

  // Delete Plan Student Payment
  @Delete('plans/:id')
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePlanStudent(@Param('id', ParseIntPipe) id: number) {
    return this.financialsService.deletePlanStudent(id);
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

  // crud for master plan or controller admin

  @Post('master-plans')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.CREATED)
  createMasterPlan(@Body() createDto: CreateMasterPlanDto) {
    return this.financialsService.createMasterPlan(createDto);
  }

  @Get('master-plans')
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.OK)
  findAllMasterPlans(@Req() req: RequestWithUser) {
    if (req.user.type === Role.Admin) {
      return this.financialsService.findAllMasterPlansForAdmin();
    }
    return this.financialsService.findActiveMasterPlans();
  }

  @Get('master-plans/:id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  findOneMasterPlan(@Param('id', ParseIntPipe) id: number) {
    return this.financialsService.findMasterPlanById(id);
  }

  @Put('master-plans/:id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  updateMasterPlan(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateMasterPlanDto,
  ) {
    return this.financialsService.updateMasterPlan(id, updateDto);
  }

  @Delete('master-plans/:id')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMasterPlan(@Param('id', ParseIntPipe) id: number) {
    return this.financialsService.deleteMasterPlan(id);
  }
}

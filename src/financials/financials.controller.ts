import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
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
import { RejectPaymentDto } from './dto/reject-payment.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  getSchemaPath,
} from '@nestjs/swagger';

type RequestWithUser = Request & {
  user: {
    user_id: number;
    type: Role;
    fullName: string;
  };
};

@Controller('financials')
@ApiBearerAuth('authorization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancialsController {
  constructor(private readonly financialsService: FinancialsService) {}

  // Create plan design payment
  @Post('plans')
  @ApiOperation({ summary: 'ایجاد پلن باشگاه مستر' })
  @ApiCreatedResponse({ description: 'پلن با موفقیت ایجاد شد' })
  @ApiNotFoundResponse({ description: 'کاربری با این مشخصات یافت نشد' })
  @ApiForbiddenResponse({ description: 'فقط استاد می‌تواند پلن ایجاد کند' })
  @ApiBody({ type: CreatePlanDto })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.CREATED)
  createPlan(@Req() req, @Body() createPlanDto: CreatePlanDto) {
    return this.financialsService.createPlanStudent(req.user.userId, createPlanDto);
  }

  // Get all plans payment
  @Get('plans')
  @ApiOperation({ summary: 'نمایش پلن های باشگاه مستر' })
  @ApiOkResponse({ description: 'پلن ها با موفقیت دریافت شد' })
  @ApiNotFoundResponse({ description: 'کاربری با این مشخصات یافت نشد' })
  @ApiForbiddenResponse({ description: 'شما مجاز به مشاهده پلن‌ها نیستید' })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  findAllPlans(@Req() req) {
    return this.financialsService.findAllPlans(req.user.userId);
  }

  // Update Plan Student Payment
  @Patch('plans/update/:id')
  @ApiOperation({ summary: 'بروزرسانی پلن های باشگاه مستر' })
  @ApiOkResponse({ description: 'پلن با موفقیت بروزرسانی شد' })
  @ApiNotFoundResponse({
    description: `
    شما مجاز به ویرایش این طرح نیستید
    پلن یافت نشد لطف مجدد امتحان کنید
    `,
  })
  @ApiParam({ name: 'id', type: Number, example: 3 })
  @ApiBody({ type: UpdatePlanDto })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  updatePlanStudent(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return this.financialsService.updatePlanStudent(id, req.user.userId, updatePlanDto);
  }

  // Delete Plan Student Payment
  @Delete('plans/:id')
  @ApiOperation({ summary: 'حذف پلن های باشگاه مستر' })
  @ApiOkResponse({ description: 'پلن باشگاه با موفقیت حذف شد' })
  @ApiNotFoundResponse({ description: 'پلن یافت نشد لطف مجدد امتحان کنید' })
  @ApiForbiddenResponse({ description: 'شما مجاز به حذف این طرح نیستید' })
  @ApiParam({ name: 'id', type: Number, example: 2 })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  deletePlanStudent(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.financialsService.deletePlanStudent(id, req.user.userId);
  }

  // Register equipment transaction
  @Post('transactions/equipment')
  @ApiOperation({ summary: 'ایجاد خرید تهجیزات یا لوازم باشگاه مستر' })
  @ApiCreatedResponse({ description: 'تراکنش با موفقیت ایجاد شد' })
  @ApiNotFoundResponse({ description: 'هنرجوی با این شناسه یافت نشد' })
  @ApiForbiddenResponse({ description: 'شما مجاز به ثبت هزینه برای این هنرجو نیستید' })
  @ApiBody({ type: CreateEquipmentDto })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.CREATED)
  createEquipmentTransaction(@Req() req, @Body() createEquipmentDto: CreateEquipmentDto) {
    return this.financialsService.createEquipmentTransaction(req.user.userId, createEquipmentDto);
  }

  // Confirms a manual payment
  @Put('transactions/:id/confirm')
  @ApiOperation({ summary: 'تایید پرداختی های تهجیزات یا پلن های هنرجو مستر' })
  @ApiOkResponse({ description: 'تراکنش با موفقیت تایید شد' })
  @ApiNotFoundResponse({ description: 'تراکنش مورد نظر یافت نشد' })
  @ApiBadRequestResponse({ description: 'این تراکنش قبلاً پرداخت شده است' })
  @ApiParam({ name: 'id', type: Number, example: 6 })
  @ApiBody({ type: ConfirmPaymentDto })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  confirmPayment(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() confirmPaymentDto: ConfirmPaymentDto,
  ) {
    return this.financialsService.confirmManualPayment(id, req.user.userId, confirmPaymentDto);
  }

  // Rejects a manual payment
  @Post('transactions/:id/reject')
  @ApiOperation({ summary: 'ردکردن تراکنش های نامعتبر هنرجو های مستر' })
  @ApiOkResponse({ description: 'تراکنش با موفقیت رد شد' })
  @ApiNotFoundResponse({ description: 'تراکنش یافت نشد' })
  @ApiBadRequestResponse({ description: 'این تراکنش قبلاً تایید شده و نمی‌توان رد کرد' })
  @ApiParam({ name: 'id', type: Number, example: 6 })
  @ApiBody({ type: RejectPaymentDto })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  rejectPayment(@Param('id', ParseIntPipe) id: number, @Body() rejectDto: RejectPaymentDto) {
    return this.financialsService.rejectManualPayment(id, rejectDto);
  }

  // Transactions Master history
  @Get('transactions/master/history')
  @ApiOperation({ summary: 'نمایش تاریخچه پرداختی های مستر' })
  @ApiOkResponse({ description: 'تراکنش ها با موفقیت دریافت شد' })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getMyTransactions(@Req() req, @Query() pageQueryDto: PaginationQueryDto) {
    return this.financialsService.getMasterTransactions(req.user.userId, pageQueryDto);
  }

  // Transactions student history
  @Get('transactions/student/history')
  @ApiOperation({ summary: 'نمایش تاریخچه پرداختی های هنرجو' })
  @ApiOkResponse({ description: 'تراکنش ها با موفقیت دریافت شد' })
  @Roles(Role.Student)
  @HttpCode(HttpStatus.OK)
  getStudentTransactions(@Req() req, @Query() pageQueryDto: PaginationQueryDto) {
    return this.financialsService.getStudentTransactions(req.user.userId, pageQueryDto);
  }

  // Returns the financial dashboard and debtor list for master
  @Get('dashboard/master')
  @ApiOperation({ summary: 'نمایش لیست شهریه و تهجیزات و غیره مستر' })
  @ApiOkResponse({ description: 'اطلاعات داشبورد با موفقیت دریافت شد' })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getMasterDashboard(@Req() req) {
    return this.financialsService.getMasterDashboard(req.user.userId);
  }

  // Returns the financial dashboard and debtor list for admin
  @Get('dashboard/admin')
  @ApiOperation({ summary: 'نمایش لیست پلن ها در انتظار و پرداختی شد و نشده ادمین' })
  @ApiOkResponse({ description: 'اطلاعات داشبورد با موفقیت دریافت شد' })
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  getAdminDashboard() {
    return this.financialsService.getAdminDashboard();
  }

  // The deposit slip records the plan
  @Post('subscriptions')
  @ApiOperation({ summary: 'ایجاد پرداخت پلن مستر' })
  @ApiCreatedResponse({ description: 'پرداخت با موفقیت ثبت شد و در انتظار تایید است' })
  @ApiNotFoundResponse({ description: 'کاربر ثبت کننده یافت نشد' })
  @ApiBadRequestResponse({
    description: `
    تصویر فیش واریزی الزامی است
    پلن انتخابی یافت نشد یا غیرفعال است
    قیمت پلن مشخص نشده است
    ابتدا باید یک پلن انتخاب کنید
    پلن شما در حال حاضر فعال است. نیازی به پرداخت جدید نیست
    شما یک پرداخت در انتظار تایید دارید
    پلن شما منقضی شده است. لطفاً ابتدا پلن جدیدی انتخاب کنید
    وضعیت پلن نامعتبر است. لطفاً وضعیت را بررسی کنید
    `,
  })
  @ApiExtraModels(CreateSubscriptionPaymentDto)
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateSubscriptionPaymentDto) },
        {
          type: 'object',
          required: ['imageFile'],
          properties: {
            imageFile: {
              type: 'string',
              format: 'binary',
              description: 'اجباری',
            },
          },
        },
      ],
    },
  })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('imageFile'))
  createSubscriptionPayment(
    @Req() req,
    @Body() createSubscriptionPaymentDto: CreateSubscriptionPaymentDto,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: true })) file: Express.Multer.File,
  ) {
    return this.financialsService.createSubscriptionPayment(
      req.user.userId,
      createSubscriptionPaymentDto,
      file,
    );
  }

  // Returns the pending payment plan
  @Get('subscriptions/pending')
  @ApiOperation({ summary: 'نمایش لیست پرداخت های در انتظار تایید ادمین' })
  @ApiOkResponse({ description: 'پرداخت های در انتظار با موفقیت دریافت شدند' })
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  getPendingSubscription() {
    return this.financialsService.getAllPendingSubscriptions();
  }

  // Master See the history of your plan payments
  @Get('subscriptions/history')
  @ApiOperation({ summary: 'نمایش تاریخچه پرداختی های مستر' })
  @ApiOkResponse({ description: 'تاریخچه پرداخت ها با موفقیت دریافت شدند' })
  @ApiNotFoundResponse({ description: 'کاربری با این مشخصات یافت نشد' })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getMySubscriptionHistory(@Req() req) {
    return this.financialsService.getMasterSubscriptionHistory(req.user.userId);
  }

  // Admin confirms the master's plan payment
  @Put('subscriptions/:id/review')
  @ApiOperation({ summary: 'تایید پرداختی های پلن مستر تایید ادمین' })
  @ApiOkResponse({
    description: `
    پرداخت تایید و پلن فعال شد
    پرداخت رد شد
    `,
  })
  @ApiNotFoundResponse({ description: 'پرداخت مورد نظر یافت نشد' })
  @ApiBadRequestResponse({
    description: `
    این پرداخت قبلاً بازبینی شده است
    پلن مرتبط با این پرداخت یافت نشد
    `,
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiParam({ name: 'id', type: Number, example: 10 })
  @ApiBody({ type: ReviewSubscriptionPaymentDto })
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  reviewSubscriptionPayment(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() reviewDto: ReviewSubscriptionPaymentDto,
  ) {
    return this.financialsService.reviewSubscriptionPayment(id, req.user.userId, reviewDto);
  }

  // crud for master plan or controller admin

  @Post('master-plans')
  @ApiOperation({ summary: 'ایجاد پلن های مستر توسط ادمین' })
  @ApiCreatedResponse({ description: 'پلن  با موفقیت ایجاد شد' })
  @ApiBadRequestResponse({
    description: `
    برای پلن‌های پولی، وارد کردن قیمت الزامی است
    قیمت وارد شده بیش از حد مجاز است
    `,
  })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({ type: CreateMasterPlanDto })
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.CREATED)
  createMasterPlan(@Body() createDto: CreateMasterPlanDto) {
    return this.financialsService.createMasterPlan(createDto);
  }

  @Get('master-plans')
  @ApiOperation({ summary: 'نمایش لیست پلن ها برای مستر و ادمین' })
  @ApiOkResponse({ description: 'لیست پلن ها با موفقیت دریافت شد' })
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.OK)
  findAllMasterPlans(@Req() req: RequestWithUser) {
    if (req.user.type === Role.Admin) {
      return this.financialsService.findAllMasterPlansForAdmin();
    }
    return this.financialsService.findActiveMasterPlans();
  }

  @Get('master-plans/:id')
  @ApiOperation({ summary: 'نمایش جزیات پلن ها مستر توسط ادمین' })
  @ApiOkResponse({ description: 'پلن با موفقیت نمایش داد شد' })
  @ApiParam({ name: 'id', type: Number, example: 10 })
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  findOneMasterPlan(@Param('id', ParseIntPipe) id: number) {
    return this.financialsService.findMasterPlanById(id);
  }

  @Patch('master-plans/update/:id')
  @ApiOperation({ summary: 'بروزرسانی پلن ها مستر توسط ادمین' })
  @ApiOkResponse({ description: 'بروزرسانی با موفقیت انجام شد' })
  @ApiNotFoundResponse({ description: 'پلن یافت نشد لطف مجدد امتحان کنید' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiParam({ name: 'id', type: Number, example: 10 })
  @ApiBody({ type: UpdateMasterPlanDto })
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  updateMasterPlan(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateMasterPlanDto) {
    return this.financialsService.updateMasterPlan(id, updateDto);
  }

  @Delete('master-plans/:id')
  @ApiOperation({ summary: 'حذف پلن های مستر توسط ادمین' })
  @ApiOkResponse({ description: 'پلن با موفقیت حذف شد' })
  @ApiNotFoundResponse({ description: 'پلن یافت نشد لطف مجدد امتحان کنید' })
  @ApiParam({ name: 'id', type: Number, example: 10 })
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  deleteMasterPlan(@Param('id', ParseIntPipe) id: number) {
    return this.financialsService.deleteMasterPlan(id);
  }
}

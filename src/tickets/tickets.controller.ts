import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Role } from 'src/auth/enums/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

@Controller('tickets')
@ApiBearerAuth('authorization')
@UseGuards(RolesGuard, JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'ایجاد تیکت توسط مستر' })
  @ApiCreatedResponse({ description: 'تیکت با موفقیت ایجاد شد' })
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiBody({ type: CreateTicketDto })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.CREATED)
  createTicket(@Req() req, @Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.createTicket(createTicketDto, req.user.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'نمایش تیکت های مستر',
    description: `
    نمونه درخواست:
    GET /api/v1/tickets?page=1&limit=10
    `,
  })
  @ApiOkResponse({ description: 'تیکت ها با موفقیت دریافت شد' })
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getTicketMaster(@Req() req, @Query() pageQueryDto: PaginationQueryDto) {
    return this.ticketsService.getTicketMasters(req.user.userId, pageQueryDto);
  }

  @Get('admin/all')
  @ApiOperation({
    summary: 'نمایش تیکت های ادمین',
    description: `
    نمونه درخواست:
    GET /api/v1/tickets/admin/all?page=1&limit=10
    `,
  })
  @ApiOkResponse({ description: 'تیکت ها با موفقیت دریافت شد' })
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  getTicketAdmin(@Query() pageQueryDto: PaginationQueryDto) {
    return this.ticketsService.getTicketAdmins(pageQueryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'نمایش جزیات تیکت بر اساس uuid' })
  @ApiOkResponse({ description: 'تیکت با موفقیت نمایش داده شد' })
  @ApiNotFoundResponse({ description: 'تیکت مورد نظر یافت نشد یا شما دسترسی ندارید' })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '53edee25-507a-4043-87a0-a95e3eac85b2',
    description: 'شناسه تیکت (UUID)',
  })
  @Roles(Role.Master, Role.Admin)
  @HttpCode(HttpStatus.OK)
  getTicketById(@Req() req, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.ticketsService.getTicketById(id, req.user.userId);
  }

  @Post(':id/message')
  @ApiOperation({ summary: 'ارسال پیام ادمین و مستر به هم' })
  @ApiCreatedResponse({ description: 'پیام با موفقیت ایجاد شد' })
  @ApiNotFoundResponse({
    description: `
    فرستنده یافت نشد
    تیکت مورد نظر یافت نشد
    `,
  })
  @ApiForbiddenResponse({
    description: `
    شما اجازه ارسال پیام در این تیکت را ندارید
    این تیکت بسته شده است و نمی‌توانید پیام جدیدی ارسال کنید
    `,
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '53edee25-507a-4043-87a0-a95e3eac85b2',
    description: 'شناسه تیکت (UUID)',
  })
  @ApiBody({ type: CreateTicketMessageDto })
  @Roles(Role.Master, Role.Admin)
  @HttpCode(HttpStatus.CREATED)
  addMessage(
    @Req() req,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() createTicketMessageDto: CreateTicketMessageDto,
  ) {
    return this.ticketsService.addMessage(id, createTicketMessageDto, req.user.userId);
  }

  @Put(':id/status')
  @ApiOperation({
    summary: 'وضعیت تیکت',
    description: `
    مثال ارسال درخواست وضعیت
    Content-Type: application/json
    {
      "status": "PENDING"
    }
    `,
  })
  @ApiOkResponse({ description: 'وضعیت تیکت با موفقیت تغییر کرد' })
  @ApiNotFoundResponse({ description: 'تیکت مورد نظر یافت نشد' })
  @ApiForbiddenResponse({ description: 'تیکت بسته شده و دیگه نمی توانید وضعیت ان را تغییر دهید' })
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    example: '53edee25-507a-4043-87a0-a95e3eac85b2',
    description: 'شناسه تیکت (UUID)',
  })
  @ApiBody({ type: UpdateTicketStatusDto })
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateTicketStatusDto: UpdateTicketStatusDto,
  ) {
    return this.ticketsService.changeTicketStatus(id, updateTicketStatusDto);
  }
}

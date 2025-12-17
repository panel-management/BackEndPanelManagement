import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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

@Controller('tickets')
@UseGuards(RolesGuard, JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @Roles(Role.Master)
  @HttpCode(HttpStatus.CREATED)
  createTicket(@Req() req, @Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.createTicket(createTicketDto, req.user.userId);
  }

  @Get()
  @Roles(Role.Master)
  @HttpCode(HttpStatus.OK)
  getTicketMaster(
    @Req() req,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.ticketsService.getTicketMasters(req.user.userId, page, limit);
  }

  @Get('/admin/all')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  getTicketAdmin(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.ticketsService.getTicketAdmins(page, limit);
  }

  @Get('/:id')
  @Roles(Role.Master, Role.Admin)
  @HttpCode(HttpStatus.OK)
  findOne(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.ticketsService.getTicketById(id, req.user.userId);
  }

  @Post('/:id/message')
  @Roles(Role.Master, Role.Admin)
  @HttpCode(HttpStatus.CREATED)
  addMessage(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() createTicketMessageDto: CreateTicketMessageDto,
  ) {
    return this.ticketsService.addMessage(
      id,
      createTicketMessageDto,
      req.user.userId,
    );
  }

  @Put('/:id/status')
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTicketStatusDto: UpdateTicketStatusDto,
  ) {
    return this.ticketsService.changeTicketStatus(id, updateTicketStatusDto);
  }
}

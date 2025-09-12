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
  getUsersTickets(@Req() req) {
    return this.ticketsService.getUsersTickets(req.user.userId);
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

  @Get('/admin/all')
  @Roles(Role.Admin)
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.ticketsService.getAllTickets();
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

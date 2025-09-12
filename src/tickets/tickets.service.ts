import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { users } from '@prisma/client';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { Role } from 'src/auth/enums/role.enum';
import { SmsServiceService } from 'src/sms-service/sms-service.service';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsServiceService,
  ) {}

  // view all tickets (user)
  async getUsersTickets(masterId: number) {
    const tickets = await this.prisma.ticket.findMany({
      where: { userId: masterId },
      include: {
        user: {
          select: {
            user_id: true,
            fullName: true,
            phoneNumber: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      statusCode: 200,
      message: 'لیست تیکت ها با موفقیت دریافت شد',
      data: tickets,
    };
  }

  // view a ticket by id (user & admin)
  async getTicketById(ticketId: number, user: users) {
    // const isTypeUsers = user.type === Role.Admin || user.type === Role.Master;

    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        userId: user.type === Role.Admin ? undefined : user.user_id,
      },
      include: {
        user: {
          select: {
            user_id: true,
            fullName: true,
            phoneNumber: true,
            type: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                user_id: true,
                fullName: true,
                phoneNumber: true,
                type: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'تیکت مورد نظر یافت نشد یا شما دسترسی ندارید',
      });
    }

    return {
      statusCode: 200,
      message: 'تیکت مورد نظر با موفقیت یافت شد',
      data: ticket,
    };
  }

  // view all tickets (admin)
  async getAllTickets() {
    const tickets = await this.prisma.ticket.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: { user_id: true, fullName: true, phoneNumber: true },
        },
      },
    });

    return {
      statusCode: 200,
      message: 'لیست تیکت ها با موفقیت دریافت شد',
      data: tickets,
    };
  }

  // Changes the status of a ticket (Admin and master).
  async changeTicketStatus(
    ticketId: number,
    updateTicketStatusDto: UpdateTicketStatusDto,
  ) {
    const ticketStatus = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: updateTicketStatusDto.status,
      },
    });

    return {
      statusCode: 200,
      message: 'وضعیت تیکت با موفقیت تغییر کرد',
      data: ticketStatus,
    };
  }

  // create ticket for master
  async createTicket(createTicketDto: CreateTicketDto, masterId: number) {
    const { title, text, category, priority } = createTicketDto;

    const newTicket = await this.prisma.ticket.create({
      data: {
        title,
        category,
        priority,
        userId: masterId,
        messages: {
          create: {
            text,
            senderId: masterId,
          },
        },
      },
      include: {
        messages: true,
        user: {
          select: {
            user_id: true,
            fullName: true,
            type: true,
          },
        },
      },
    });

    return {
      statusCode: 201,
      message: 'تیکت شما با موفقیت ثبت شد',
      data: newTicket,
    };
  }

  // message or admin and master
  async addMessage(
    ticketId: number,
    createTicketMessageDto: CreateTicketMessageDto,
    senderId: number,
  ) {
    const findTicket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { user: true },
    });
    if (!findTicket) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'تیکت مورد نظر یافت نشد',
      });
    }

    if (findTicket.status === 'CLOSED') {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'این تیکت بسته شده است و نمی‌توانید پیام جدیدی ارسال کنید',
      });
    }

    const messageTicket = await this.prisma.ticketMessage.create({
      data: {
        text: createTicketMessageDto.text,
        senderId: senderId,
        ticketId: ticketId,
      },
    });

    if (findTicket.user.type === Role.Admin && findTicket.user.phoneNumber) {
      const recipientPhoneNumber = findTicket.user.phoneNumber;
      const smsText = `مدیر محترم، جناب آقای ${findTicket.user.fullName}
پاسخی برای تیکت پشتیبانی شما توسط ادمین ثبت گردید.
لطفاً جهت مشاهده پاسخ، وارد پنل کاربری خود شوید.`;

      try {
        await this.smsService.sendMessageToUser(recipientPhoneNumber, smsText);
      } catch (error) {
        console.error('خطا در ارسال پیامک', error);
      }
    }

    return {
      statusCode: 201,
      message: 'پیام با موفقیت به تیکت اضافه شد',
      data: messageTicket,
    };
  }
}

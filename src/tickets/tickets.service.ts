import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketPriority, TicketStatus, users } from '@prisma/client';
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
  async getTicketMasters(masterId: number, page: number, limit: number) {
    const total = await this.prisma.ticket.count({
      where: { userId: masterId },
    });

    const tickets = await this.prisma.ticket.findMany({
      where: { userId: masterId },
      select: {
        id: true,
        title: true,
        category: true,
        priority: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            user_id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      statusCode: 200,
      message: 'لیست تیکت ها با موفقیت دریافت شد',
      data: tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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
      select: {
        id: true,
        title: true,
        category: true,
        priority: true,
        status: true,
        user: {
          select: {
            fullName: true,
          },
        },
        messages: {
          select: {
            id: true,
            text: true,
            sender: {
              select: {
                user_id: true,
                fullName: true,
                type: true,
              },
            },
            senderId: true,
            ticketId: true,
            createdAt: true,
          },
        },
        createdAt: true,
        updatedAt: true,
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
  async getTicketAdmins(page: number, limit: number) {
    const where = {};

    const [total, openTickets, pendingTickets, highPriorityTickets, tickets] =
      await this.prisma.$transaction([
        this.prisma.ticket.count({ where }),

        this.prisma.ticket.count({
          where: { status: TicketStatus.OPEN },
        }),

        this.prisma.ticket.count({
          where: { status: TicketStatus.PENDING },
        }),

        this.prisma.ticket.count({
          where: { priority: TicketPriority.HIGH },
        }),

        this.prisma.ticket.findMany({
          where,
          select: {
            id: true,
            title: true,
            category: true,
            priority: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                user_id: true,
                fullName: true,
                type: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

    return {
      statusCode: 200,
      message: 'لیست تیکت‌ها با موفقیت دریافت شد',
      data: tickets,
      stats: {
        total,
        open: openTickets,
        pending: pendingTickets,
        highPriority: highPriorityTickets,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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

    if (ticketStatus.status === 'CLOSED') {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'تیکت بسته شده و دیگه نمی توانید وضعیت ان را تغییر دهید',
      });
    }

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

    const sender = await this.prisma.users.findUnique({
      where: { user_id: senderId },
      select: { type: true, fullName: true },
    });

    if (!sender) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'فرستنده یافت نشد',
      });
    }

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
      include: {
        sender: {
          select: {
            fullName: true,
            type: true,
          },
        },
      },
    });

    let newStatus: TicketStatus;
    if (sender?.type === Role.Master) {
      newStatus = TicketStatus.PENDING;
    } else if (sender?.type === Role.Admin) {
      newStatus = TicketStatus.RESOLVED;
    } else {
      newStatus = findTicket.status;
    }

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: newStatus,
      },
    });

    if (findTicket.user.type === Role.Admin && findTicket.user.phoneNumber) {
      const smsText = `مدیر محترم، جناب آقای ${findTicket.user.fullName}
پاسخی برای تیکت پشتیبانی شما توسط ادمین ثبت گردید.
لطفاً جهت مشاهده پاسخ، وارد پنل کاربری خود شوید.`;
      try {
        await this.smsService.sendMessageToUser(
          findTicket.user.phoneNumber,
          smsText,
        );
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

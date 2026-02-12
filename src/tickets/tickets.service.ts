import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketPriority, TicketStatus, users } from '@prisma/client';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { Role } from 'src/auth/enums/role.enum';
import { SmsService } from 'src/sms/sms.service';
import { PaginationQueryDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
  ) {}

  // view all tickets (user)
  async getTicketMasters(masterId: number, pageQueryDto: PaginationQueryDto) {
    const { page = 1, limit = 10 } = pageQueryDto;
    const skip = (page - 1) * limit;

    const [tickets, total] = await this.prisma.$transaction([
      this.prisma.ticket.findMany({
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
        skip: skip,
        take: limit,
      }),
      this.prisma.ticket.count({
        where: { userId: masterId },
      }),
    ]);

    return {
      statusCode: HttpStatus.OK,
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

  // view all tickets (admin)
  async getTicketAdmins(pageQueryDto: PaginationQueryDto) {
    const { page = 1, limit = 10 } = pageQueryDto;
    const skip = (page - 1) * limit;

    const [total, openTickets, pendingTickets, highPriorityTickets, tickets] =
      await this.prisma.$transaction([
        this.prisma.ticket.count({ where: {} }),

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
          where: {},
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
          skip: skip,
          take: limit,
        }),
      ]);

    return {
      statusCode: HttpStatus.OK,
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

  // view a ticket by id (user & admin)
  async getTicketById(ticketId: string, user: users) {
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
      throw new HttpException('تیکت مورد نظر یافت نشد یا شما دسترسی ندارید', HttpStatus.NOT_FOUND);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'تیکت مورد نظر با موفقیت یافت شد',
      data: ticket,
    };
  }

  // Changes the status of a ticket (Admin and master).
  async changeTicketStatus(ticketId: string, updateTicketStatusDto: UpdateTicketStatusDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new HttpException('تیکت یافت نشد', HttpStatus.NOT_FOUND);
    }

    if (ticket.status === TicketStatus.CLOSED) {
      throw new HttpException(
        'تیکت بسته شده و دیگه نمی توانید وضعیت ان را تغییر دهید',
        HttpStatus.FORBIDDEN,
      );
    }

    const ticketStatus = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: updateTicketStatusDto.status,
      },
    });

    return {
      statusCode: HttpStatus.OK,
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
      statusCode: HttpStatus.CREATED,
      message: 'تیکت شما با موفقیت ثبت شد',
      data: newTicket,
    };
  }

  // message or admin and master
  async addMessage(
    ticketId: string,
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
      throw new HttpException('فرستنده یافت نشد', HttpStatus.NOT_FOUND);
    }

    if (sender.type !== Role.Admin && findTicket?.userId !== senderId) {
      throw new HttpException('شما اجازه ارسال پیام در این تیکت را ندارید', HttpStatus.FORBIDDEN);
    }

    if (!findTicket) {
      throw new HttpException('تیکت مورد نظر یافت نشد', HttpStatus.NOT_FOUND);
    }

    if (findTicket.status === TicketStatus.CLOSED) {
      throw new HttpException(
        'این تیکت بسته شده است و نمی‌توانید پیام جدیدی ارسال کنید',
        HttpStatus.FORBIDDEN,
      );
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
      await this.smsService.sendMessageToUser(
        findTicket.user.phoneNumber,
        `مدیر محترم، جناب آقای ${findTicket.user.fullName}
پاسخی برای تیکت پشتیبانی شما توسط ادمین ثبت گردید.
لطفاً جهت مشاهده پاسخ، وارد پنل کاربری خود شوید.`,
      );
    }

    return {
      statusCode: HttpStatus.CREATED,
      message: 'پیام با موفقیت به تیکت اضافه شد',
      data: messageTicket,
    };
  }
}

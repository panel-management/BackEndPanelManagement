import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { SportBeltService } from './sport-belt.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Public } from 'src/auth/decorators/public.decorator';
import { ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('sport-belt')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SportBeltController {
  constructor(private readonly sportBeltService: SportBeltService) {}

  @Public()
  @Get('sport')
  @ApiOperation({ summary: 'دریافت لیست ورزش ها' })
  @ApiOkResponse({ description: 'لیست ورزش ها با موفقیت دیافت شد' })
  @HttpCode(HttpStatus.OK)
  getSports() {
    return this.sportBeltService.getSport();
  }

  @Get('belt')
  @ApiBearerAuth("authorization")
  @ApiOperation({ summary: 'دریافت لیست کمربند ها' })
  @ApiOkResponse({ description: 'لیست کمربند ها با موفقیت دریافت شد' })
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.OK)
  getBelts() {
    return this.sportBeltService.getBelt();
  }

  @Get('belt/:id')
  @ApiBearerAuth("authorization")
  @ApiOperation({ summary: 'دریافت کمربند براساس id کمربند' })
  @ApiOkResponse({ description: 'کمربند با موفقیت دریافت شد' })
  @ApiNotFoundResponse({ description: 'کمربند مورد نظر یافت نشد' })
  @ApiParam({ name: "id", description: "id کمربند", required: true, type: Number })
  @Roles(Role.Admin, Role.Master)
  @HttpCode(HttpStatus.OK)
  getBeltById(@Param('id', ParseIntPipe) beltId: number) {
    return this.sportBeltService.getBeltById(beltId);
  }
}

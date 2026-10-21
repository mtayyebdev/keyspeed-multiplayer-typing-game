import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminTextsService } from './admin-texts.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';

@ApiTags('admin-texts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/texts')
export class AdminTextsController {
  constructor(private readonly textsService: AdminTextsService) {}

  @Get()
  @ApiOperation({ summary: 'Paginated texts library with filters and usage stats' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('difficulty') difficulty?: string,
    @Query('language') language?: string,
    @Query('status') status?: string,
  ) {
    return this.textsService.findAll({
      page,
      limit,
      search,
      difficulty,
      language,
      status,
    });
  }

  @Post()
  @ApiOperation({ summary: 'Create a new typing paragraph' })
  create(
    @Body() dto: { content: string; difficulty?: string; language?: string; isActive?: boolean },
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.textsService.create(dto, admin, ip);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update typing paragraph content or status' })
  update(
    @Param('id') id: string,
    @Body() dto: { content?: string; difficulty?: string; language?: string; isActive?: boolean },
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.textsService.update(id, dto, admin, ip);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete typing paragraph' })
  delete(
    @Param('id') id: string,
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.textsService.delete(id, admin, ip);
  }

  @Post('import')
  @ApiOperation({ summary: 'Bulk import paragraphs from JSON/CSV data' })
  importTexts(
    @Body('items') items: Array<{ content: string; difficulty?: string; language?: string }>,
    @GetUser() admin: any,
    @Req() req: Request,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress;
    return this.textsService.importTexts(items, admin, ip);
  }
}


import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { DataService } from './data.service.js';
import { AdminGuard, AuthGuard, AuthService, OptionalAuthGuard, publicUser, type AuthRequest } from './auth.js';
import { ChapterDto, LoginDto, LoreDto, ProgressDto, RegisterDto, VoteDto } from './dto.js';
@Controller()
export class StoryController {
  constructor(private readonly data: DataService, private readonly auth: AuthService) {}
  @Get('health') health() { return { status: 'ok', service: 'The Last Lighthouse' }; }
  @Get('chapters') async chapters() { return (await this.data.chapters()).map(c => ({ ...(c.contentJson as Record<string, unknown>), slug: c.slug, title: c.title })); }
  @Get('chapters/:slug') async chapter(@Param('slug') slug: string) { const chapter = (await this.chapters()).find(c => c.slug === slug); if (!chapter) throw new NotFoundException('Chapter not found.'); return chapter; }
  @Get('lore') async lore(@Query('unlock') unlock?: string) { const entries = await this.data.lore(); return unlock ? entries.filter(e => unlock.split(',').includes(e.unlockFlag)) : entries; }
  @Post('auth/register') register(@Body() dto: RegisterDto) { return this.auth.register(dto); }
  @Post('auth/login') login(@Body() dto: LoginDto) { return this.auth.login(dto); }
  @Get('auth/me') @UseGuards(AuthGuard) me(@Req() req: AuthRequest) { return publicUser(req.user!); }
  @Get('progress') @UseGuards(AuthGuard) progress(@Req() req: AuthRequest) { return this.data.progress(req.user!.id); }
  @Put('progress') @UseGuards(OptionalAuthGuard) saveProgress(@Req() req: AuthRequest, @Body() dto: ProgressDto) { return req.user ? this.data.saveProgress(req.user.id, dto) : { saved: false, storage: 'local', message: 'Sign in for cloud storage.' }; }
  @Post('choices/:id/vote') vote(@Param('id') id: string, @Body() dto: VoteDto) { return this.data.vote(id,dto); }
}
@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly data: DataService) {}
  @Get('analytics') analytics() { return this.data.analytics(); }
  @Get('chapters') chapters() { return this.data.chapters(true); }
  @Post('chapters') createChapter(@Body() dto: ChapterDto) { return this.data.saveChapter(dto,true); }
  @Put('chapters/:slug') updateChapter(@Param('slug') slug: string, @Body() dto: ChapterDto) { if (slug !== dto.slug) throw new NotFoundException('Chapter slug cannot be changed.'); return this.data.saveChapter(dto); }
  @Delete('chapters/:slug') deleteChapter(@Param('slug') slug: string) { return this.data.deleteChapter(slug); }
  @Get('lore') lore() { return this.data.lore(); }
  @Post('lore') createLore(@Body() dto: LoreDto) { return this.data.saveLore(dto,true); }
  @Put('lore/:slug') updateLore(@Param('slug') slug: string, @Body() dto: LoreDto) { if (slug !== dto.slug) throw new NotFoundException('Memory slug cannot be changed.'); return this.data.saveLore(dto); }
  @Delete('lore/:slug') deleteLore(@Param('slug') slug: string) { return this.data.deleteLore(slug); }
}

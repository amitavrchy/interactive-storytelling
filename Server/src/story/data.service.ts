import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcrypt';
import type { ChapterDto, LoreDto, ProgressDto, VoteDto } from './dto.js';

export type Reader = { id: string; email: string; name: string; passwordHash: string; role: 'READER' | 'ADMIN' };
type ChapterRecord = Omit<ChapterDto, 'contentJson'> & { contentJson: Record<string, unknown> };
type Saved = ProgressDto & { updatedAt: string };
type Data = { users: Reader[]; chapters: ChapterRecord[]; lore: LoreDto[]; progress: Record<string, Saved>; votes: Record<string, { choiceId: string; optionKey: string }>; stats: Record<string, number> };
type Seed = { chapters: Array<{ slug: string; title: string } & Record<string, unknown>>; lore: LoreDto[] };
const seedPath = fileURLToPath(new URL('../content/story.json', import.meta.url));
const seed = JSON.parse(readFileSync(seedPath, 'utf8')) as Seed;

@Injectable()
export class DataService implements OnModuleInit {
  private readonly fileMode = process.env.STORAGE_MODE === 'file';
  private readonly path = resolve(process.env.DATA_FILE || '.data/lighthouse.json');
  private data: Data;
  constructor(private readonly prisma: PrismaService) {
    this.data = { users: [], chapters: seed.chapters.map(({ slug, title, ...contentJson }, sortOrder) => ({ slug, title, sortOrder, contentJson, published: true })), lore: seed.lore, progress: {}, votes: {}, stats: {} };
    if (this.fileMode && existsSync(this.path)) this.data = JSON.parse(readFileSync(this.path, 'utf8')) as Data;
  }
  async onModuleInit() {
    if (this.fileMode) {
      if (process.env.NODE_ENV === 'production') throw new Error('File storage is development-only. Configure PostgreSQL for production.');
      new Logger('Storage').warn('Using explicit single-process file storage for development.'); this.persist();
    } else {
      for (const chapter of this.data.chapters) await this.prisma.chapter.upsert({ where: { slug: chapter.slug }, update: {}, create: { ...chapter, contentJson: chapter.contentJson as never } });
      for (const entry of this.data.lore) await this.prisma.loreEntry.upsert({ where: { slug: entry.slug }, update: {}, create: { slug: entry.slug, title: entry.title, body: entry.body, unlockFlag: entry.unlockFlag, contentJson: { category: entry.category, date: entry.date } } });
    }
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(); const password = process.env.ADMIN_PASSWORD;
    if (email && password) {
      if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) throw new Error('ADMIN_PASSWORD must be 12–72 UTF-8 bytes.');
      const existing = await this.findUser(email);
      if (!existing) await this.createUser({ email, name: 'North Point Studio', passwordHash: await hash(password, 12), role: 'ADMIN' });
      else if (existing.role !== 'ADMIN') throw new Error('ADMIN_EMAIL belongs to an existing reader. Use a different administrator email.');
    }
  }
  private persist() { if (!this.fileMode) return; mkdirSync(dirname(this.path), { recursive: true }); const tmp = `${this.path}.tmp`; writeFileSync(tmp, JSON.stringify(this.data, null, 2), { mode: 0o600 }); renameSync(tmp, this.path); }
  async findUser(email: string): Promise<Reader | null> { return this.fileMode ? this.data.users.find(u => u.email === email) || null : this.prisma.user.findUnique({ where: { email } }); }
  async getUser(id: string): Promise<Reader | null> { return this.fileMode ? this.data.users.find(u => u.id === id) || null : this.prisma.user.findUnique({ where: { id } }); }
  async createUser(input: Omit<Reader, 'id'>): Promise<Reader> {
    if (this.fileMode) { if (this.data.users.some(u => u.email === input.email)) throw new ConflictException('An account with that email already exists.'); const user = { ...input, id: randomUUID() }; this.data.users.push(user); this.persist(); return user; }
    try { return await this.prisma.user.create({ data: input }); } catch (error) { if ((error as { code?: string }).code === 'P2002') throw new ConflictException('An account with that email already exists.'); throw error; }
  }
  async chapters(admin = false) { return this.fileMode ? this.data.chapters.filter(c => admin || c.published).sort((a,b) => a.sortOrder-b.sortOrder) : this.prisma.chapter.findMany({ where: admin ? {} : { published: true }, orderBy: { sortOrder: 'asc' } }); }
  async saveChapter(dto: ChapterDto, create = false) {
    if (seed.chapters.some(c => c.slug === dto.slug) && !dto.published) throw new BadRequestException('Core story chapters must stay published. Edit their copy instead.');
    const exists = (await this.chapters(true)).some(c => c.slug === dto.slug);
    if (create && exists) throw new ConflictException('A chapter with this slug already exists.');
    if (!create && !exists) throw new NotFoundException('Chapter not found.');
    if (this.fileMode) { this.data.chapters = [...this.data.chapters.filter(c => c.slug !== dto.slug), dto as unknown as ChapterRecord]; this.persist(); return dto; }
    return this.prisma.chapter.upsert({ where: { slug: dto.slug }, update: { ...dto, contentJson: dto.contentJson as never }, create: { ...dto, contentJson: dto.contentJson as never } });
  }
  async deleteChapter(slug: string) { if (seed.chapters.some(c => c.slug === slug)) throw new BadRequestException('Core story chapters cannot be deleted.'); if (!(await this.chapters(true)).some(c => c.slug === slug)) throw new NotFoundException('Chapter not found.'); if (this.fileMode) { this.data.chapters = this.data.chapters.filter(c => c.slug !== slug); this.persist(); } else await this.prisma.chapter.delete({ where: { slug } }); return { deleted: true }; }
  async lore() { if (this.fileMode) return this.data.lore; return (await this.prisma.loreEntry.findMany()).map(e => ({ slug: e.slug, title: e.title, body: e.body, unlockFlag: e.unlockFlag, ...(e.contentJson as { category: string; date: string }) })); }
  async saveLore(dto: LoreDto, create = false) {
    const exists = (await this.lore()).some(e => e.slug === dto.slug);
    if (create && exists) throw new ConflictException('A memory with this slug already exists.');
    if (!create && !exists) throw new NotFoundException('Memory not found.');
    if (this.fileMode) { this.data.lore = [...this.data.lore.filter(e => e.slug !== dto.slug), dto]; this.persist(); return dto; }
    const { category, date, ...rest } = dto; const values = { ...rest, contentJson: { category, date } };
    return this.prisma.loreEntry.upsert({ where: { slug: dto.slug }, update: values, create: values });
  }
  async deleteLore(slug: string) { if (!(await this.lore()).some(e => e.slug === slug)) throw new NotFoundException('Memory not found.'); if (this.fileMode) { this.data.lore = this.data.lore.filter(e => e.slug !== slug); this.persist(); } else await this.prisma.loreEntry.delete({ where: { slug } }); return { deleted: true }; }
  async progress(userId: string): Promise<Saved | null> {
    if (this.fileMode) return this.data.progress[userId] || null;
    const p = await this.prisma.storyProgress.findUnique({ where: { userId } }); return p ? { ...(p.flagsJson as unknown as ProgressDto), updatedAt: p.updatedAt.toISOString() } : null;
  }
  async saveProgress(userId: string, progress: ProgressDto) {
    const ceiling = progress.ending ? 5 : 3; const furthestChapter = Math.min(progress.furthestChapter, ceiling);
    const allowedFlags = seed.chapters.slice(0,furthestChapter+1).map(c => c.unlockFlag);
    const normalized = { ...progress, furthestChapter, chapterIndex: Math.min(progress.chapterIndex,furthestChapter), completed: !!progress.ending && progress.completed, flags: progress.flags.filter(f => allowedFlags.includes(f) && (f !== 'complete' || (!!progress.ending && progress.completed))) };
    const saved = { ...normalized, updatedAt: new Date().toISOString() };
    if (this.fileMode) { this.data.progress[userId] = saved; this.persist(); return saved; }
    const values = { flagsJson: normalized as never, chapterSlug: seed.chapters[normalized.chapterIndex].slug, ending: normalized.ending };
    await this.prisma.storyProgress.upsert({ where: { userId }, update: values, create: { userId, ...values } }); return saved;
  }
  async vote(choiceId: string, dto: VoteDto) {
    if (choiceId !== 'the-last-light') throw new NotFoundException('Unknown choice.');
    if (this.fileMode) {
      const existing = this.data.votes[dto.requestId];
      if (existing && (existing.optionKey !== dto.optionKey || existing.choiceId !== choiceId)) throw new ConflictException('This request was already used for a different choice.');
      if (!existing) { this.data.votes[dto.requestId] = { choiceId, optionKey: dto.optionKey }; const key = `${choiceId}:${dto.optionKey}`; this.data.stats[key] = (this.data.stats[key] || 0) + 1; this.persist(); }
    } else {
      const existing = await this.prisma.choiceVote.findUnique({ where: { requestId: dto.requestId } });
      if (existing && (existing.optionKey !== dto.optionKey || existing.choiceId !== choiceId)) throw new ConflictException('This request was already used for a different choice.');
      if (!existing) try { await this.prisma.$transaction([this.prisma.choiceVote.create({ data: { ...dto, choiceId } }), this.prisma.choiceStat.upsert({ where: { choiceId_optionKey: { choiceId, optionKey: dto.optionKey } }, update: { count: { increment: 1 } }, create: { choiceId, optionKey: dto.optionKey, count: 1 } })]); } catch (error) { if ((error as { code?: string }).code !== 'P2002') throw error; const prior = await this.prisma.choiceVote.findUnique({ where: { requestId: dto.requestId } }); if (prior?.optionKey !== dto.optionKey) throw new ConflictException('Conflicting vote.'); }
    }
    return { recorded: true };
  }
  async analytics() { const values = this.fileMode ? Object.entries(this.data.stats).map(([key,count]) => ({ choiceId: key.split(':')[0], optionKey: key.split(':')[1], count })) : await this.prisma.choiceStat.findMany(); return { choices: values, total: values.reduce((n,v) => n+v.count, 0) }; }
}

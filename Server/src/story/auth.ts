import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { DataService, type Reader } from './data.service.js';
import type { LoginDto, RegisterDto } from './dto.js';
import type { Request } from 'express';
export type AuthRequest = Request & { user?: Reader };
export function publicUser(user: Reader) { return { id: user.id, email: user.email, name: user.name, role: user.role }; }
@Injectable()
export class AuthService {
  constructor(private readonly data: DataService, private readonly jwt: JwtService) {}
  private byteCheck(password: string) { if (Buffer.byteLength(password, 'utf8') > 72) throw new BadRequestException('Password must be at most 72 UTF-8 bytes.'); }
  async register(dto: RegisterDto) {
    this.byteCheck(dto.password);
    const user = await this.data.createUser({ email: dto.email.trim().toLowerCase(), name: dto.name.trim(), passwordHash: await hash(dto.password, 12), role: 'READER' });
    return this.session(user);
  }
  async login(dto: LoginDto) {
    this.byteCheck(dto.password);
    const user = await this.data.findUser(dto.email.trim().toLowerCase());
    // Always run bcrypt, including for unknown accounts, to reduce timing differences.
    const valid = await compare(dto.password, user?.passwordHash || '$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW');
    if (!user || !valid) throw new UnauthorizedException('Email or password is incorrect.');
    return this.session(user);
  }
  private session(user: Reader) { return { user: publicUser(user), accessToken: this.jwt.sign({ sub: user.id }, { expiresIn: '12h' }) }; }
}
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(protected readonly jwt: JwtService, protected readonly data: DataService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new UnauthorizedException('Sign in to continue.');
    try {
      const claims = this.jwt.verify<{ sub: string }>(header.slice(7), { algorithms: ['HS256'] });
      const user = await this.data.getUser(claims.sub);
      if (!user) throw new Error('User removed');
      request.user = user; return true;
    } catch { throw new UnauthorizedException('Your session has expired. Please sign in again.'); }
  }
}
@Injectable()
export class OptionalAuthGuard extends AuthGuard {
  override async canActivate(context: ExecutionContext) { return context.switchToHttp().getRequest<AuthRequest>().headers.authorization ? super.canActivate(context) : true; }
}
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) { if (context.switchToHttp().getRequest<AuthRequest>().user?.role !== 'ADMIN') throw new ForbiddenException('A studio administrator account is required.'); return true; }
}

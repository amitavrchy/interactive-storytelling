import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { randomBytes } from 'node:crypto';
import { DataService } from './data.service.js';
import { AdminGuard, AuthGuard, AuthService, OptionalAuthGuard } from './auth.js';
import { AdminController, StoryController } from './story.controller.js';
@Module({
  imports: [JwtModule.registerAsync({ useFactory: () => {
    let secret = process.env.JWT_SECRET;
    if (!secret || secret.startsWith('replace-with')) {
      if (process.env.NODE_ENV === 'production') throw new Error('Set a strong JWT_SECRET before starting production.');
      secret = randomBytes(48).toString('hex');
    }
    if (secret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters.');
    return { secret, signOptions: { algorithm: 'HS256' as const } };
  } })],
  controllers: [StoryController, AdminController], providers: [DataService, AuthService, AuthGuard, OptionalAuthGuard, AdminGuard],
})
export class StoryModule {}

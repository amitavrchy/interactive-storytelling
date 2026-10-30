import { type INestApplication, ValidationPipe } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { clientOrigins } from './environment.js';
export function configureApp(app: INestApplication) {
  app.enableCors({
    origin: clientOrigins(process.env.CLIENT_ORIGIN || 'http://localhost:3000'),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  const express = app.getHttpAdapter().getInstance();
  express.disable('x-powered-by');
  express.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS || 0));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const buckets = new Map<string, { count: number; expires: number }>();
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (
      req.headers.authorization ||
      /^\/(auth|progress|admin)(\/|$)/.test(req.path)
    )
      res.setHeader('Cache-Control', 'no-store');
    if (req.path.startsWith('/auth') || req.path.includes('/vote')) {
      const route = req.path.startsWith('/auth') ? '/auth' : '/choices/vote';
      const key = `${req.ip}:${route}`;
      const now = Date.now();
      if (buckets.size >= 10000) {
        for (const [k, v] of buckets) if (v.expires <= now) buckets.delete(k);
        if (!buckets.has(key) && buckets.size >= 10000) {
          res.setHeader('Retry-After', 60);
          res.status(429).json({ message: 'Please try again in a minute.' });
          return;
        }
      }
      const current = buckets.get(key);
      const entry =
        current && current.expires > now
          ? current
          : { count: 0, expires: now + 60000 };
      entry.count++;
      buckets.set(key, entry);
      if (entry.count > 30) {
        res.setHeader('Retry-After', Math.ceil((entry.expires - now) / 1000));
        res
          .status(429)
          .json({ message: 'Too many requests. Please wait a minute.' });
        return;
      }
    }
    next();
  });
  app.enableShutdownHooks();
}

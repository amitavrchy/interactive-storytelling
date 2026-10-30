import { type INestApplication, ValidationPipe } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
export function configureApp(app: INestApplication) {
  app.enableCors({
    origin: (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
      .split(',')
      .map((s) => s.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
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
    if (req.path.startsWith('/auth') || req.path.includes('/vote')) {
      const key = `${req.ip}:${req.path}`;
      const now = Date.now();
      const current = buckets.get(key);
      const entry =
        current && current.expires > now
          ? current
          : { count: 0, expires: now + 60000 };
      entry.count++;
      buckets.set(key, entry);
      if (buckets.size > 10000)
        for (const [k, v] of buckets) if (v.expires <= now) buckets.delete(k);
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

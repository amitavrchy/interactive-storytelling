type Environment = Record<string, unknown>;

export function clientOrigins(value: string) {
  return value.split(',').map((origin) => {
    const url = new URL(origin.trim());
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error(
        'CLIENT_ORIGIN must contain complete HTTP(S) origins without paths or credentials.',
      );
    }
    return url.origin;
  });
}

export function validateEnvironment(config: Environment): Environment {
  const mode = String(config.STORAGE_MODE || 'database');
  if (!['database', 'file'].includes(mode))
    throw new Error('STORAGE_MODE must be database or file.');
  const port = Number(config.PORT || 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT must be an integer between 1 and 65535.');
  const proxyHops = Number(config.TRUST_PROXY_HOPS || 0);
  if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 10)
    throw new Error('TRUST_PROXY_HOPS must be an integer between 0 and 10.');
  if (config.CLIENT_ORIGIN) clientOrigins(String(config.CLIENT_ORIGIN));
  if (config.NODE_ENV !== 'production') return config;
  if (mode !== 'database')
    throw new Error('Production requires PostgreSQL storage.');
  const secret = String(config.JWT_SECRET || '');
  if (secret.length < 32 || secret.startsWith('replace-with'))
    throw new Error(
      'Production requires a non-placeholder JWT_SECRET of at least 32 characters.',
    );
  let database: URL;
  try {
    database = new URL(String(config.DATABASE_URL || ''));
  } catch {
    throw new Error('Production requires a valid PostgreSQL DATABASE_URL.');
  }
  if (
    !['postgres:', 'postgresql:'].includes(database.protocol) ||
    !database.hostname ||
    database.pathname.length < 2
  )
    throw new Error('Production requires a valid PostgreSQL DATABASE_URL.');
  if (!config.CLIENT_ORIGIN)
    throw new Error('Production requires an explicit CLIENT_ORIGIN.');
  for (const origin of clientOrigins(String(config.CLIENT_ORIGIN))) {
    const url = new URL(origin);
    if (
      url.protocol !== 'https:' &&
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    )
      throw new Error('Public production CLIENT_ORIGIN values must use HTTPS.');
  }
  if (!!config.ADMIN_EMAIL !== !!config.ADMIN_PASSWORD)
    throw new Error(
      'Set both ADMIN_EMAIL and ADMIN_PASSWORD, or leave both empty.',
    );
  return config;
}

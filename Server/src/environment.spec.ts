import { clientOrigins, validateEnvironment } from './environment.js';
const production = {
  NODE_ENV: 'production',
  STORAGE_MODE: 'database',
  PORT: '4000',
  JWT_SECRET: 'test-only-production-key-longer-than-32-characters',
  DATABASE_URL: 'postgresql://reader:test@127.0.0.1:5432/lighthouse',
  CLIENT_ORIGIN: 'https://story.example.test',
};
describe('Production configuration', () => {
  it('accepts explicit PostgreSQL, signing key and HTTPS origin', () => {
    expect(validateEnvironment(production)).toEqual(production);
    expect(
      clientOrigins('https://one.example.test/, https://two.example.test'),
    ).toEqual(['https://one.example.test', 'https://two.example.test']);
  });
  it.each([
    { STORAGE_MODE: 'file' },
    { JWT_SECRET: '' },
    { JWT_SECRET: 'replace-with-at-least-32-random-characters' },
    { DATABASE_URL: '' },
    { DATABASE_URL: 'mysql://localhost/lighthouse' },
    { CLIENT_ORIGIN: '' },
    { CLIENT_ORIGIN: '*' },
    { CLIENT_ORIGIN: 'https://example.test/private' },
    { CLIENT_ORIGIN: 'http://public.example.test' },
    { PORT: 'not-a-number' },
    { TRUST_PROXY_HOPS: 'true' },
    { ADMIN_EMAIL: 'admin@example.test' },
  ])('rejects an unsafe or incomplete production setting: %j', (override) => {
    expect(() => validateEnvironment({ ...production, ...override })).toThrow();
  });
  it('allows explicit file mode for local development only', () => {
    expect(
      validateEnvironment({ NODE_ENV: 'development', STORAGE_MODE: 'file' }),
    ).toBeTruthy();
  });
});

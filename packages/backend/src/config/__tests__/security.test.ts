import { describe, expect, it, vi } from 'vitest';
import { getCorsOrigins, getJwtSecret } from '../security';

describe('security configuration', () => {
  it('uses configured JWT secrets', () => {
    expect(getJwtSecret({ JWT_SECRET: 'test-secret' })).toBe('test-secret');
  });

  it('uses a development-only JWT secret when none is configured', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(getJwtSecret({ NODE_ENV: 'development' })).toBeTruthy();
    expect(warning).toHaveBeenCalledOnce();
  });

  it('requires a JWT secret in production', () => {
    expect(() => getJwtSecret({ NODE_ENV: 'production' })).toThrow('JWT_SECRET');
  });

  it('uses the configured comma-separated CORS allowlist', () => {
    expect(
      getCorsOrigins({ CORS_ORIGIN: 'https://app.example.com, https://admin.example.com ' }),
    ).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('uses the local frontend origin during development', () => {
    expect(getCorsOrigins({ NODE_ENV: 'development' })).toEqual(['http://localhost:5188']);
  });

  it('requires an explicit CORS allowlist in production', () => {
    expect(() => getCorsOrigins({ NODE_ENV: 'production' })).toThrow('CORS_ORIGIN');
  });
});

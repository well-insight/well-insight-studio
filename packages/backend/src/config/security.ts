const DEVELOPMENT_JWT_SECRET = 'development-only-secret-change-me';

function isProduction(env: NodeJS.ProcessEnv): boolean {
  return env.NODE_ENV === 'production';
}

export function getJwtSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.JWT_SECRET?.trim();
  if (secret) return secret;

  if (isProduction(env)) {
    throw new Error('[SECURITY] JWT_SECRET must be set in production');
  }

  console.warn('[SECURITY] JWT_SECRET is not set; using a development-only secret');
  return DEVELOPMENT_JWT_SECRET;
}

export function getCorsOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const configuredOrigins = env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) return configuredOrigins;

  if (isProduction(env)) {
    throw new Error('[SECURITY] CORS_ORIGIN must list allowed origins in production');
  }

  return ['http://localhost:5188'];
}

import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { getOpenApiSpec } from './openapi';

export function setupSwagger(app: Express, port: number): void {
  const spec = getOpenApiSpec(port) as Record<string, unknown>;

  app.get('/api-docs/openapi.json', (_req, res) => {
    res.json(spec);
  });

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'API 文档',
    }),
  );
}

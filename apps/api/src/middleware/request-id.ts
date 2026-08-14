import type { MiddlewareHandler } from 'hono'

export const requestId: MiddlewareHandler = async (context, next) => {
  const id = context.req.header('x-request-id') ?? crypto.randomUUID()
  context.set('requestId', id)
  await next()
  context.header('x-request-id', id)
}

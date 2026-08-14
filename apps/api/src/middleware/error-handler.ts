import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const errorHandler: ErrorHandler = (error, context) => {
  const requestId = context.get('requestId')
  if (error instanceof HTTPException) {
    return context.json({ error: { code: 'REQUEST_ERROR', message: error.message, requestId } }, error.status)
  }

  console.error({ requestId, error })
  return context.json({ error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error', requestId } }, 500)
}

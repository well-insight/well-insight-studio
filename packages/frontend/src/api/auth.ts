export interface AuthUser {
  id: string
  email: string
  username: string
  /** 显示名称 / 昵称 */
  display_name?: string | null
  role?: string
  is_active?: number | boolean
  created_at?: string
  updated_at?: string
  last_login_at?: string
}

/** 界面展示用：优先显示名称，否则回退用户名 */
export function userDisplayLabel(user: Pick<AuthUser, 'display_name' | 'username'>): string {
  const d = user.display_name?.trim()
  return d || user.username
}

function apiBase(): string {
  return (
    (import.meta.env.VITE_APP_API_URL as string | undefined)
    || (import.meta.env.VITE_API_BASE_URL as string | undefined)
    || 'http://localhost:3001/api/v1'
  )
}

export interface LoginPayload {
  /** 邮箱或用户名 */
  account: string
  password: string
}

export async function loginRequest(
  payload: LoginPayload,
): Promise<{ ok: true, token: string, user: AuthUser, message: string } | { ok: false, message: string }> {
  const res = await fetch(`${apiBase()}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ account: payload.account.trim(), password: payload.password }),
  })

  let data: Record<string, unknown> = {}
  try {
    data = (await res.json()) as Record<string, unknown>
  }
  catch {
    /* ignore */
  }

  if (res.ok && data.success === true && typeof data.token === 'string' && data.user) {
    return {
      ok: true,
      token: data.token,
      user: data.user as AuthUser,
      message: String(data.message ?? '登录成功'),
    }
  }

  const message
    = (typeof data.message === 'string' && data.message)
      || (typeof data.error === 'string' && data.error)
      || '登录失败'

  return { ok: false, message }
}

export interface RegisterPayload {
  email: string
  username: string
  password: string
  /** 显示名称 / 昵称，省略时后端默认与用户名相同 */
  display_name?: string
}

/** 注册成功后后端会直接返回与登录相同的 token/user（HTTP 201） */
export async function registerRequest(
  payload: RegisterPayload,
): Promise<{ ok: true, token: string, user: AuthUser, message: string } | { ok: false, message: string }> {
  const body: Record<string, string> = {
    email: payload.email,
    username: payload.username,
    password: payload.password,
  }
  const nick = payload.display_name?.trim()
  if (nick)
    body.display_name = nick

  const res = await fetch(`${apiBase()}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  let data: Record<string, unknown> = {}
  try {
    data = (await res.json()) as Record<string, unknown>
  }
  catch {
    /* ignore */
  }

  if (res.ok && data.success === true && typeof data.token === 'string' && data.user) {
    return {
      ok: true,
      token: data.token,
      user: data.user as AuthUser,
      message: String(data.message ?? '注册成功'),
    }
  }

  const message
    = (typeof data.message === 'string' && data.message)
      || (typeof data.error === 'string' && data.error)
      || '注册失败'

  return { ok: false, message }
}

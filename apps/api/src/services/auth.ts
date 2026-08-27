import type {SignOptions} from 'jsonwebtoken';
import type { AppConfig } from '../config/env'
import { compare, hash } from 'bcrypt'
import jwt from 'jsonwebtoken'

export interface TokenPayload {
  userId: string
  email: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

const SALT_ROUNDS = 10

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, hashValue: string): Promise<boolean> {
  return compare(plain, hashValue)
}

export function createTokens(payload: TokenPayload, config: AppConfig): AuthTokens {
  const accessOptions: SignOptions = { expiresIn: config.JWT_EXPIRES_IN as SignOptions['expiresIn'] }
  const refreshOptions: SignOptions = { expiresIn: config.REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'] }
  const accessToken = jwt.sign(payload, config.JWT_SECRET, accessOptions)
  const refreshToken = jwt.sign({ sub: payload.userId }, config.JWT_SECRET, refreshOptions)
  return { accessToken, refreshToken }
}

export function verifyAccessToken(token: string, config: AppConfig): TokenPayload {
  return jwt.verify(token, config.JWT_SECRET) as TokenPayload
}

export function verifyRefreshToken(token: string, config: AppConfig): { sub: string } {
  return jwt.verify(token, config.JWT_SECRET) as { sub: string }
}

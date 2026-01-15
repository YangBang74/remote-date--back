import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { JWT_SECRET, JWT_EXPIRES_IN } from '../../config/env'

export interface JWTPayload {
  userId: string
  email: string
}

const REFRESH_TOKEN_EXPIRY_DAYS = 30

class JWTService {
  /**
   * Генерирует JWT access токен
   */
  generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    })
  }

  /**
   * Генерирует refresh токен (случайная строка)
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex')
  }

  /**
   * Проверяет и декодирует JWT токен
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
      return decoded
    } catch (error) {
      return null
    }
  }

  /**
   * Получить дату истечения refresh token
   */
  getRefreshTokenExpiry(): Date {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS)
    return expiresAt
  }

  /**
   * Извлекает токен из заголовка Authorization
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) {
      return null
    }

    const parts = authHeader.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null
    }

    return parts[1]
  }
}

export const jwtService = new JWTService()

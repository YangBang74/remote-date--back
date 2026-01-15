import { Request, Response, NextFunction } from 'express'
import { jwtService } from './jwt.service'
import { authService } from './auth.service'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    email: string
  }
}

/**
 * Middleware для проверки Bearer токена
 */
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    const token = jwtService.extractTokenFromHeader(authHeader)

    if (!token) {
      res.status(401).json({ error: 'Authorization token required' })
      return
    }

    const payload = jwtService.verifyToken(token)

    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    // Проверяем, что пользователь существует в БД
    const user = await authService.getUserById(payload.userId)

    if (!user || !user.verified) {
      res.status(401).json({ error: 'User not found or not verified' })
      return
    }

    // Добавляем информацию о пользователе в request
    req.user = {
      userId: payload.userId,
      email: payload.email,
    }

    next()
  } catch (error: any) {
    res.status(401).json({ error: 'Authentication failed' })
  }
}

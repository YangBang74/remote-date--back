import { Request, Response } from 'express'
import { authService } from './auth.service'
import type { RegisterDto, RegisterCheckDto, LoginDto } from './auth.types'
import { AuthRequest } from './auth.middleware'

export const AuthController = {
  /**
   * Регистрация - отправка кода на email
   * POST /api/auth/register
   */
  async register(req: Request, res: Response) {
    try {
      const { email, password } = req.body as RegisterDto

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required' })
      }

      if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Password is required' })
      }

      const result = await authService.register({ email, password })
      res.status(200).json(result)
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to register' })
    }
  },

  /**
   * Проверка кода подтверждения
   * POST /api/auth/register-check
   */
  async registerCheck(req: Request, res: Response) {
    try {
      const { email, code } = req.body as RegisterCheckDto

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required' })
      }

      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Verification code is required' })
      }

      const result = await authService.registerCheck({ email, code })
      res.status(200).json(result)
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to verify code' })
    }
  },

  /**
   * Вход в систему
   * POST /api/auth/login
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body as LoginDto

      if (!email || typeof email !== 'string') {
        return res.status(400).json({ error: 'Email is required' })
      }

      if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Password is required' })
      }

      const result = await authService.login({ email, password })
      res.status(200).json(result)
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Login failed' })
    }
  },

  /**
   * Получить информацию о текущем пользователе
   * GET /api/auth/me
   */
  async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' })
      }

      const user = await authService.getUserById(req.user.userId)

      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }

      // Не возвращаем пароль
      res.json({
        userId: user._id.toString(),
        email: user.email,
        verified: user.verified,
        createdAt: user.createdAt,
      })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to get user info' })
    }
  },

  /**
   * Обновление access токена
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken || typeof refreshToken !== 'string') {
        return res.status(400).json({ error: 'Refresh token is required' })
      }

      const result = await authService.refreshAccessToken(refreshToken)
      res.status(200).json(result)
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Failed to refresh token' })
    }
  },

  /**
   * Выход из системы
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body

      if (refreshToken && typeof refreshToken === 'string') {
        await authService.logout(refreshToken)
      }

      res.status(200).json({ message: 'Logged out successfully' })
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to logout' })
    }
  },
}

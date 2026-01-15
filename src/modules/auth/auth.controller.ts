import { Request, Response } from 'express'
import { authService } from './auth.service'
import type { RegisterDto, RegisterCheckDto, LoginDto } from './auth.types'

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
}

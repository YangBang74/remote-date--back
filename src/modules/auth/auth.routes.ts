import { Router } from 'express'
import { AuthController } from './auth.controller'
import { authMiddleware } from './auth.middleware'

const router = Router()

router.post('/register', AuthController.register)
router.post('/register-check', AuthController.registerCheck)
router.post('/login', AuthController.login)
router.post('/refresh', AuthController.refresh)
router.post('/logout', AuthController.logout)
router.get('/me', authMiddleware, AuthController.getMe)

export default router

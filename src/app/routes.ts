import { Router } from 'express'
import chatRoutes from '../modules/chat/chat.routes'
import roomRoutes from '../modules/room/room.routes'
import authRoutes from '../modules/auth/auth.routes'

const router = Router()

router.use('/chat', chatRoutes)
router.use('/rooms', roomRoutes)
router.use('/auth', authRoutes)

export default router
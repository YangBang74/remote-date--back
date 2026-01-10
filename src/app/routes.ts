import { Router } from 'express'
import chatRoutes from '../modules/chat/chat.routes'
import roomRoutes from '../modules/room/room.routes'

const router = Router()

router.use('/chat', chatRoutes)
router.use('/rooms', roomRoutes)

export default router

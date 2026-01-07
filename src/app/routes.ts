import { Router } from 'express'
import chatRoutes from '../modules/chat/chat.routes'

const router = Router()

router.use('/chat', chatRoutes)

export default router

import { Router } from 'express'
import { ChatController } from './chat.controller'

const router = Router();

router.get('/:room', ChatController.getRoomMessages)

export default router

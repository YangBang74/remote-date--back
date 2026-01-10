import { Router } from 'express'
import { RoomController } from './room.controller'

const router = Router()

router.post('/', RoomController.createRoom)
router.get('/:id', RoomController.getRoom)
router.get('/:id/state', RoomController.getRoomState)

export default router

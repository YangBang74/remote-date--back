import { Request, Response } from 'express'
import { roomService } from './room.service'

export const RoomController = {
  /**
   * Создать новую комнату
   * POST /api/rooms
   */
  async createRoom(req: Request, res: Response) {
    try {
      const { youtubeUrl } = req.body

      if (!youtubeUrl || typeof youtubeUrl !== 'string') {
        return res.status(400).json({ error: 'youtubeUrl is required' })
      }

      const room = roomService.createRoom({ youtubeUrl })
      res.status(201).json(room)
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to create room' })
    }
  },

  /**
   * Получить информацию о комнате
   * GET /api/rooms/:id
   */
  async getRoom(req: Request, res: Response) {
    try {
      const { id } = req.params
      const room = roomService.getRoom(id)

      if (!room) {
        return res.status(404).json({ error: 'Room not found' })
      }

      res.json(room)
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to get room' })
    }
  },

  /**
   * Получить состояние видео в комнате
   * GET /api/rooms/:id/state
   */
  async getRoomState(req: Request, res: Response) {
    try {
      const { id } = req.params
      const state = roomService.getRoomState(id)

      if (!state) {
        return res.status(404).json({ error: 'Room not found' })
      }

      res.json(state)
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to get room state' })
    }
  },
}

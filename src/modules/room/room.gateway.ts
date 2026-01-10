import { Server, Socket } from 'socket.io'
import { roomService } from './room.service'
import { VideoEvent } from './room.types'

export default function roomGateway(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Room gateway - Connected:', socket.id)

    /**
     * Присоединение к комнате
     */
    socket.on('room:join', (roomId: string) => {
      const room = roomService.getRoom(roomId)

      if (!room) {
        socket.emit('room:error', { message: 'Room not found' })
        return
      }

      socket.join(roomId)
      roomService.addParticipant(roomId)

      // Отправляем текущее состояние видео новому участнику
      const state = roomService.getRoomState(roomId)
      if (state) {
        socket.emit('video:state', state)
      }

      // Уведомляем других участников
      socket.to(roomId).emit('room:user_joined', {
        roomId,
        participants: room.participants,
      })

      console.log(`User ${socket.id} joined room ${roomId}`)
    })

    /**
     * Выход из комнаты
     */
    socket.on('room:leave', (roomId: string) => {
      socket.leave(roomId)
      roomService.removeParticipant(roomId)

      const room = roomService.getRoom(roomId)
      if (room) {
        socket.to(roomId).emit('room:user_left', {
          roomId,
          participants: room.participants,
        })
      }

      console.log(`User ${socket.id} left room ${roomId}`)
    })

    /**
     * Воспроизведение видео
     */
    socket.on('video:play', (data: { roomId: string; currentTime?: number }) => {
      const { roomId, currentTime } = data
      const room = roomService.getRoom(roomId)

      if (!room) {
        socket.emit('room:error', { message: 'Room not found' })
        return
      }

      // Обновляем состояние на сервере
      const newState = roomService.updateRoomState(roomId, {
        isPlaying: true,
        currentTime: currentTime ?? room.currentTime,
      })

      // Отправляем событие всем участникам комнаты (кроме отправителя)
      socket.to(roomId).emit('video:play', {
        currentTime: newState?.currentTime ?? 0,
        timestamp: newState?.timestamp ?? Date.now(),
      })

      console.log(`Video play in room ${roomId} at ${currentTime}`)
    })

    /**
     * Пауза видео
     */
    socket.on('video:pause', (data: { roomId: string; currentTime?: number }) => {
      const { roomId, currentTime } = data
      const room = roomService.getRoom(roomId)

      if (!room) {
        socket.emit('room:error', { message: 'Room not found' })
        return
      }

      // Обновляем состояние на сервере
      const newState = roomService.updateRoomState(roomId, {
        isPlaying: false,
        currentTime: currentTime ?? room.currentTime,
      })

      // Отправляем событие всем участникам комнаты (кроме отправителя)
      socket.to(roomId).emit('video:pause', {
        currentTime: newState?.currentTime ?? 0,
        timestamp: newState?.timestamp ?? Date.now(),
      })

      console.log(`Video pause in room ${roomId} at ${currentTime}`)
    })

    /**
     * Перемотка видео
     */
    socket.on('video:seek', (data: { roomId: string; currentTime: number }) => {
      const { roomId, currentTime } = data
      const room = roomService.getRoom(roomId)

      if (!room) {
        socket.emit('room:error', { message: 'Room not found' })
        return
      }

      if (typeof currentTime !== 'number' || currentTime < 0) {
        socket.emit('room:error', { message: 'Invalid currentTime' })
        return
      }

      // Обновляем состояние на сервере (ставим на паузу при перемотке)
      const newState = roomService.updateRoomState(roomId, {
        currentTime,
        isPlaying: false, // При перемотке всегда ставим на паузу
      })

      // Отправляем событие перемотки всем участникам комнаты (кроме отправителя)
      socket.to(roomId).emit('video:seek', {
        currentTime: newState?.currentTime ?? 0,
        timestamp: newState?.timestamp ?? Date.now(),
      })

      // Также отправляем событие паузы, чтобы все поставили на паузу
      socket.to(roomId).emit('video:pause', {
        currentTime: newState?.currentTime ?? 0,
        timestamp: newState?.timestamp ?? Date.now(),
      })

      console.log(`Video seek in room ${roomId} to ${currentTime} (paused)`)
    })

    /**
     * Запрос синхронизации (для новых участников)
     */
    socket.on('video:sync_request', (roomId: string) => {
      const state = roomService.getRoomState(roomId)

      if (state) {
        socket.emit('video:sync', state)
      } else {
        socket.emit('room:error', { message: 'Room not found' })
      }
    })

    /**
     * Отключение
     */
    socket.on('disconnect', () => {
      // Находим все комнаты, в которых был пользователь
      const rooms = Array.from(socket.rooms)
      rooms.forEach((roomId) => {
        if (roomId !== socket.id) {
          roomService.removeParticipant(roomId)
          const room = roomService.getRoom(roomId)
          if (room) {
            io.to(roomId).emit('room:user_left', {
              roomId,
              participants: room.participants,
            })
          }
        }
      })

      console.log('Room gateway - Disconnected:', socket.id)
    })
  })
}

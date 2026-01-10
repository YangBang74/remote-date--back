import { VideoRoom, CreateRoomDto, VideoState } from './room.types'
import { v4 as uuidv4 } from 'uuid'

class RoomService {
  private rooms: Map<string, VideoRoom> = new Map()
  private roomStates: Map<string, VideoState> = new Map()

  /**
   * Извлекает ID видео из YouTube URL
   */
  private extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }

  /**
   * Создает новую комнату
   */
  createRoom(dto: CreateRoomDto): VideoRoom {
    const videoId = this.extractVideoId(dto.youtubeUrl)

    if (!videoId) {
      throw new Error('Invalid YouTube URL')
    }

    const room: VideoRoom = {
      id: uuidv4(),
      youtubeUrl: dto.youtubeUrl,
      youtubeVideoId: videoId,
      createdAt: new Date(),
      currentTime: 0,
      isPlaying: false,
      participants: 0,
    }

    this.rooms.set(room.id, room)
    this.roomStates.set(room.id, {
      currentTime: 0,
      isPlaying: false,
      timestamp: Date.now(),
    })

    return room
  }

  /**
   * Получает комнату по ID
   */
  getRoom(roomId: string): VideoRoom | null {
    return this.rooms.get(roomId) || null
  }

  /**
   * Получает состояние видео в комнате
   */
  getRoomState(roomId: string): VideoState | null {
    return this.roomStates.get(roomId) || null
  }

  /**
   * Обновляет состояние видео в комнате
   */
  updateRoomState(roomId: string, state: Partial<VideoState>): VideoState | null {
    const currentState = this.roomStates.get(roomId)
    if (!currentState) {
      return null
    }

    const newState: VideoState = {
      ...currentState,
      ...state,
      timestamp: Date.now(),
    }

    this.roomStates.set(roomId, newState)

    // Обновляем также в объекте комнаты
    const room = this.rooms.get(roomId)
    if (room) {
      if (state.currentTime !== undefined) {
        room.currentTime = state.currentTime
      }
      if (state.isPlaying !== undefined) {
        room.isPlaying = state.isPlaying
      }
    }

    return newState
  }

  /**
   * Увеличивает счетчик участников
   */
  addParticipant(roomId: string): void {
    const room = this.rooms.get(roomId)
    if (room) {
      room.participants++
    }
  }

  /**
   * Уменьшает счетчик участников
   */
  removeParticipant(roomId: string): void {
    const room = this.rooms.get(roomId)
    if (room) {
      room.participants = Math.max(0, room.participants - 1)
    }
  }

  /**
   * Удаляет комнату
   */
  deleteRoom(roomId: string): boolean {
    this.roomStates.delete(roomId)
    return this.rooms.delete(roomId)
  }
}

export const roomService = new RoomService()

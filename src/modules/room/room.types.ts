export interface VideoRoom {
  id: string
  youtubeUrl: string
  youtubeVideoId: string
  createdAt: Date
  currentTime: number
  isPlaying: boolean
  participants: number
}

export interface CreateRoomDto {
  youtubeUrl: string
}

export interface VideoState {
  currentTime: number
  isPlaying: boolean
  timestamp: number // Время сервера для синхронизации
}

export interface VideoEvent {
  type: 'play' | 'pause' | 'seek'
  currentTime?: number
  timestamp: number
}

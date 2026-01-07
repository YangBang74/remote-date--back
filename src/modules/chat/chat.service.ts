import { ChatMessage } from './chat.types'

class ChatService {
  async saveMessage(msg: ChatMessage) {
    console.log('Saved:', msg)
  }

  async getMessages(room: string) {
    return []
  }
}

export const chatService = new ChatService()

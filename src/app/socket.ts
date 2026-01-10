import { Server, Socket } from 'socket.io'
import socketConfig from '../config/socket'
import chatGateway from '../modules/chat/chat.gateway'
import roomGateway from '../modules/room/room.gateway'

export function initSocket(server: any) {
  const io = new Server(server, socketConfig)

  // Подключаем все gateway
  chatGateway(io)
  roomGateway(io)

  return io
}

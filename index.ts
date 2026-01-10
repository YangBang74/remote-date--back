import { server } from './src/app/server'
import { PORT } from './src/config/env'
import { connectDB } from './src/config/db'

async function bootstrap() {
  // Пытаемся подключиться к БД (опционально)
  await connectDB()

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
    console.log(`📡 Socket.io ready for connections`)
    console.log(`🎬 Video rooms API available at http://localhost:${PORT}/api/rooms`)
  })
}

bootstrap()

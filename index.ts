import { server } from './src/app/server'
import { PORT } from './src/config/env'
import { connectDB } from './src/config/db'

async function bootstrap() {
  await connectDB()

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

bootstrap()

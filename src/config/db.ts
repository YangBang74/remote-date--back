import mongoose from 'mongoose'

export async function connectDB() {
  const mongoUrl = process.env.MONGO_URL

  // MongoDB опционален - если URL не указан, пропускаем подключение
  if (!mongoUrl) {
    console.log('⚠️  MongoDB URL not provided, skipping database connection')
    return
  }

  try {
    await mongoose.connect(mongoUrl)
    console.log('🍃 MongoDB connected')
  } catch (err) {
    console.error('❌ MongoDB connection error:', err)
    console.log('⚠️  Continuing without database (using in-memory storage)')
    // Не завершаем процесс - продолжаем работу без БД
  }
}

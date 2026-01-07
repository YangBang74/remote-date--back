import mongoose from 'mongoose'

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URL as string)
    console.log('🍃 MongoDB connected')
  } catch (err) {
    console.error('❌ MongoDB connection error:', err)
    process.exit(1)
  }
}

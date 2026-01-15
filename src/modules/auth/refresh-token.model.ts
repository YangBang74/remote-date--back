import mongoose, { Schema, Document } from 'mongoose'

export interface IRefreshToken extends Document {
  userId: string
  token: string
  expiresAt: Date
  createdAt: Date
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Автоматическое удаление истекших токенов
    },
  },
  {
    timestamps: true,
    collection: 'refresh_tokens',
  }
)

// Индексы для быстрого поиска
RefreshTokenSchema.index({ userId: 1, token: 1 })
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const RefreshToken =
  mongoose.models.RefreshToken || mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema)

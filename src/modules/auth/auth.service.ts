import * as bcrypt from 'bcrypt'
import type { RegisterDto, RegisterCheckDto, LoginDto, VerificationCode } from './auth.types'
import { emailService } from './email.service'
import { User, IUser } from './user.model'
import { RefreshToken } from './refresh-token.model'
import { jwtService } from './jwt.service'

class AuthService {
  private verificationCodes: Map<string, VerificationCode> = new Map()
  private readonly CODE_EXPIRY_MINUTES = 15

  /**
   * Генерирует код подтверждения (6 цифр)
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Регистрация - отправка кода на email
   */
  async register(dto: RegisterDto): Promise<{ message: string; email: string }> {
    const { email, password } = dto

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }

    // Валидация пароля (минимум 6 символов)
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters')
    }

    const normalizedEmail = email.toLowerCase()

    // Проверяем, существует ли пользователь в БД
    const existingUser = await User.findOne({ email: normalizedEmail })

    if (existingUser && existingUser.verified) {
      throw new Error('User with this email already exists')
    }

    // Если пользователь существует, но не подтвержден, удаляем его и старый код
    if (existingUser) {
      await User.deleteOne({ _id: existingUser._id })
      this.verificationCodes.delete(normalizedEmail)
    }

    // Генерируем код подтверждения
    const code = this.generateVerificationCode()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRY_MINUTES)

    // Сохраняем код
    const verificationCode: VerificationCode = {
      email: normalizedEmail,
      code,
      expiresAt,
    }
    this.verificationCodes.set(normalizedEmail, verificationCode)

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10)

    // Создаем нового пользователя в БД (не подтвержденного)
    try {
      const newUser = new User({
        email: normalizedEmail,
        password: hashedPassword,
        verified: false,
      })
      await newUser.save()
    } catch (error: any) {
      // Если ошибка уникальности (дубликат email), значит пользователь уже существует
      if (error.code === 11000 || error.name === 'MongoServerError') {
        throw new Error('User with this email already exists')
      }
      throw error
    }

    // Отправляем код на email
    try {
      await emailService.sendVerificationCode(email, code)
    } catch (error: any) {
      // Если не удалось отправить email, удаляем временные данные
      this.verificationCodes.delete(normalizedEmail)
      await User.deleteOne({ email: normalizedEmail })
      throw new Error('Failed to send verification code. Please try again.')
    }

    return {
      message: 'Verification code sent to your email',
      email: email,
    }
  }

  /**
   * Проверка кода подтверждения и завершение регистрации
   */
  async registerCheck(
    dto: RegisterCheckDto
  ): Promise<{ message: string; userId: string; token: string }> {
    const { email, code } = dto

    const normalizedEmail = email.toLowerCase()

    // Получаем код подтверждения
    const verificationCode = this.verificationCodes.get(normalizedEmail)

    if (!verificationCode) {
      throw new Error('Verification code not found or expired')
    }

    // Проверяем срок действия
    if (new Date() > verificationCode.expiresAt) {
      this.verificationCodes.delete(normalizedEmail)
      throw new Error('Verification code has expired')
    }

    // Проверяем код
    if (verificationCode.code !== code) {
      throw new Error('Invalid verification code')
    }

    // Находим пользователя в БД
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      throw new Error('User not found')
    }

    // Подтверждаем пользователя в БД
    user.verified = true
    await user.save()

    // Удаляем использованный код
    this.verificationCodes.delete(normalizedEmail)

    const userId = user._id.toString()

    // Генерируем access и refresh токены
    const accessToken = jwtService.generateAccessToken({
      userId,
      email: user.email,
    })
    const refreshToken = jwtService.generateRefreshToken()

    // Сохраняем refresh token в БД
    const refreshTokenExpiry = jwtService.getRefreshTokenExpiry()
    await RefreshToken.create({
      userId,
      token: refreshToken,
      expiresAt: refreshTokenExpiry,
    })

    return {
      message: 'Registration successful',
      userId,
      accessToken,
      refreshToken,
    }
  }

  /**
   * Вход в систему
   */
  async login(
    dto: LoginDto
  ): Promise<{ message: string; userId: string; email: string; accessToken: string; refreshToken: string }> {
    const { email, password } = dto

    const normalizedEmail = email.toLowerCase()

    // Находим пользователя в БД
    const user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      throw new Error('Invalid email or password')
    }

    // Проверяем, что пользователь подтвержден
    if (!user.verified) {
      throw new Error('Please verify your email first')
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new Error('Invalid email or password')
    }

    const userId = user._id.toString()

    // Генерируем access и refresh токены
    const accessToken = jwtService.generateAccessToken({
      userId,
      email: user.email,
    })
    const refreshToken = jwtService.generateRefreshToken()

    // Сохраняем refresh token в БД
    const refreshTokenExpiry = jwtService.getRefreshTokenExpiry()
    await RefreshToken.create({
      userId,
      token: refreshToken,
      expiresAt: refreshTokenExpiry,
    })

    return {
      message: 'Login successful',
      userId,
      email: user.email,
      accessToken,
      refreshToken,
    }
  }

  /**
   * Получить пользователя по ID
   */
  async getUserById(userId: string): Promise<IUser | null> {
    try {
      return await User.findById(userId)
    } catch (error) {
      return null
    }
  }

  /**
   * Получить пользователя по email
   */
  async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email: email.toLowerCase() })
  }

  /**
   * Обновление access токена с помощью refresh токена
   */
  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Находим refresh token в БД
    const tokenDoc = await RefreshToken.findOne({ token: refreshToken })

    if (!tokenDoc) {
      throw new Error('Invalid refresh token')
    }

    // Проверяем срок действия
    if (new Date() > tokenDoc.expiresAt) {
      await RefreshToken.deleteOne({ _id: tokenDoc._id })
      throw new Error('Refresh token has expired')
    }

    // Находим пользователя
    const user = await User.findById(tokenDoc.userId)

    if (!user || !user.verified) {
      throw new Error('User not found or not verified')
    }

    // Генерируем новые токены
    const newAccessToken = jwtService.generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
    })
    const newRefreshToken = jwtService.generateRefreshToken()

    // Удаляем старый refresh token
    await RefreshToken.deleteOne({ _id: tokenDoc._id })

    // Сохраняем новый refresh token
    const refreshTokenExpiry = jwtService.getRefreshTokenExpiry()
    await RefreshToken.create({
      userId: user._id.toString(),
      token: newRefreshToken,
      expiresAt: refreshTokenExpiry,
    })

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }
  }

  /**
   * Выход из системы (удаление refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    await RefreshToken.deleteOne({ token: refreshToken })
  }

  /**
   * Выход из всех устройств (удаление всех refresh tokens пользователя)
   */
  async logoutAll(userId: string): Promise<void> {
    await RefreshToken.deleteMany({ userId })
  }
}

export const authService = new AuthService()

import { v4 as uuidv4 } from 'uuid'
import * as bcrypt from 'bcrypt'
import type { RegisterDto, RegisterCheckDto, LoginDto, User, VerificationCode } from './auth.types'
import { emailService } from './email.service'

class AuthService {
  private users: Map<string, User> = new Map()
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

    // Проверяем, существует ли пользователь
    const existingUser = Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    )

    if (existingUser && existingUser.verified) {
      throw new Error('User with this email already exists')
    }

    // Если пользователь существует, но не подтвержден, удаляем старый код
    if (existingUser) {
      this.verificationCodes.delete(existingUser.email.toLowerCase())
      this.users.delete(existingUser.id)
    }

    // Генерируем код подтверждения
    const code = this.generateVerificationCode()
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + this.CODE_EXPIRY_MINUTES)

    // Сохраняем код
    const verificationCode: VerificationCode = {
      email: email.toLowerCase(),
      code,
      expiresAt,
    }
    this.verificationCodes.set(email.toLowerCase(), verificationCode)

    // Хешируем пароль и создаем временного пользователя (не подтвержденного)
    const hashedPassword = await bcrypt.hash(password, 10)
    const tempUser: User = {
      id: uuidv4(),
      email: email.toLowerCase(),
      password: hashedPassword,
      createdAt: new Date(),
      verified: false,
    }
    this.users.set(tempUser.id, tempUser)

    // Отправляем код на email
    try {
      await emailService.sendVerificationCode(email, code)
    } catch (error: any) {
      // Если не удалось отправить email, удаляем временные данные
      this.verificationCodes.delete(email.toLowerCase())
      this.users.delete(tempUser.id)
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
  async registerCheck(dto: RegisterCheckDto): Promise<{ message: string; userId: string }> {
    const { email, code } = dto

    // Получаем код подтверждения
    const verificationCode = this.verificationCodes.get(email.toLowerCase())

    if (!verificationCode) {
      throw new Error('Verification code not found or expired')
    }

    // Проверяем срок действия
    if (new Date() > verificationCode.expiresAt) {
      this.verificationCodes.delete(email.toLowerCase())
      throw new Error('Verification code has expired')
    }

    // Проверяем код
    if (verificationCode.code !== code) {
      throw new Error('Invalid verification code')
    }

    // Находим пользователя
    const user = Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    )

    if (!user) {
      throw new Error('User not found')
    }

    // Подтверждаем пользователя
    user.verified = true
    this.users.set(user.id, user)

    // Удаляем использованный код
    this.verificationCodes.delete(email.toLowerCase())

    return {
      message: 'Registration successful',
      userId: user.id,
    }
  }

  /**
   * Вход в систему
   */
  async login(dto: LoginDto): Promise<{ message: string; userId: string; email: string }> {
    const { email, password } = dto

    // Находим пользователя
    const user = Array.from(this.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    )

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

    return {
      message: 'Login successful',
      userId: user.id,
      email: user.email,
    }
  }

  /**
   * Получить пользователя по ID
   */
  getUserById(userId: string): User | null {
    return this.users.get(userId) || null
  }

  /**
   * Получить пользователя по email
   */
  getUserByEmail(email: string): User | null {
    return (
      Array.from(this.users.values()).find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      ) || null
    )
  }
}

export const authService = new AuthService()

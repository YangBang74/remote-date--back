export interface RegisterDto {
  email: string
  password: string
}

export interface RegisterCheckDto {
  email: string
  code: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface User {
  id: string
  email: string
  password: string
  createdAt: Date
  verified: boolean
}

export interface VerificationCode {
  email: string
  code: string
  expiresAt: Date
}

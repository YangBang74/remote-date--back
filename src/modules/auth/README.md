# Auth Module

Модуль для аутентификации пользователей с подтверждением email.

## API Endpoints

### POST /api/auth/register
Регистрация пользователя - отправляет код подтверждения на email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Verification code sent to your email",
  "email": "user@example.com"
}
```

### POST /api/auth/register-check
Проверка кода подтверждения и завершение регистрации.

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "Registration successful",
  "userId": "uuid",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/login
Вход в систему.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "userId": "uuid",
  "email": "user@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /api/auth/me
Получить информацию о текущем пользователе (требует Bearer token).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "verified": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## Настройка Email

Для отправки email настройте переменные окружения в `.env`:

```env
# Реальный SMTP (рекомендуется для продакшена)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Или оставьте пустым для режима разработки (коды будут в консоли)
```

В режиме разработки (без SMTP):
- Коды подтверждения выводятся в консоль сервера
- Для тестирования можно использовать Ethereal Email (автоматически)

## Bearer Token Authentication

После успешной регистрации (`register-check`) и входа (`login`) API возвращает access и refresh токены:

```json
{
  "message": "Registration successful",
  "userId": "uuid",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "abc123def456..."
}
```

### Использование токена

Для защищенных эндпоинтов добавьте заголовок:
```
Authorization: Bearer <token>
```

### Защищенные эндпоинты

- `GET /api/auth/me` - Получить информацию о текущем пользователе (требует токен)

### Middleware

Используйте `authMiddleware` для защиты роутов:
```typescript
import { authMiddleware } from './auth.middleware'

router.get('/protected', authMiddleware, handler)
```

### POST /api/auth/refresh
Обновление access токена с помощью refresh токена.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_string"
}
```

**Response:**
```json
{
  "accessToken": "new_access_token",
  "refreshToken": "new_refresh_token"
}
```

### POST /api/auth/logout
Выход из системы (удаление refresh token).

**Request Body:**
```json
{
  "refreshToken": "refresh_token_string"
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

## Зависимости

Установите необходимые пакеты:
```bash
npm install nodemailer bcrypt jsonwebtoken
npm install --save-dev @types/nodemailer @types/bcrypt @types/jsonwebtoken
```

## Переменные окружения

Добавьте в `.env`:
```env
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d  # Время жизни access токена (по умолчанию 7 дней)
# Refresh токены хранятся в БД и автоматически удаляются через 30 дней
```

## Refresh Token механизм

- **Access Token**: короткоживущий токен (по умолчанию 7 дней), используется для доступа к защищенным ресурсам
- **Refresh Token**: долгоживущий токен (30 дней), хранится в БД, используется для обновления access token
- При истечении access token автоматически обновляется с помощью refresh token
- Refresh токены автоматически удаляются из БД при истечении срока действия (MongoDB TTL индекс)

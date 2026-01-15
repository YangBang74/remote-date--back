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
  "userId": "uuid"
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
  "email": "user@example.com"
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

## Зависимости

Установите необходимые пакеты:
```bash
npm install nodemailer bcrypt
npm install --save-dev @types/nodemailer @types/bcrypt
```

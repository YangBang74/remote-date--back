# Video Room API

API для создания комнат и синхронизации воспроизведения YouTube видео в реальном времени.

## REST API

### Создать комнату
```
POST /api/rooms
Content-Type: application/json

{
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Ответ:**
```json
{
  "id": "uuid-room-id",
  "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "youtubeVideoId": "dQw4w9WgXcQ",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "currentTime": 0,
  "isPlaying": false,
  "participants": 0
}
```

### Получить информацию о комнате
```
GET /api/rooms/:id
```

### Получить состояние видео
```
GET /api/rooms/:id/state
```

**Ответ:**
```json
{
  "currentTime": 120.5,
  "isPlaying": true,
  "timestamp": 1704067200000
}
```

## Socket.io Events

### Присоединиться к комнате
```javascript
socket.emit('room:join', roomId)
```

**События, которые приходят:**
- `video:state` - текущее состояние видео (при присоединении)
- `room:user_joined` - новый пользователь присоединился
- `room:user_left` - пользователь покинул комнату

### Воспроизведение
```javascript
socket.emit('video:play', {
  roomId: 'room-id',
  currentTime: 120.5  // опционально
})
```

**Событие для других участников:**
```javascript
socket.on('video:play', (data) => {
  // data: { currentTime, timestamp }
})
```

### Пауза
```javascript
socket.emit('video:pause', {
  roomId: 'room-id',
  currentTime: 120.5  // опционально
})
```

**Событие для других участников:**
```javascript
socket.on('video:pause', (data) => {
  // data: { currentTime, timestamp }
})
```

### Перемотка
```javascript
socket.emit('video:seek', {
  roomId: 'room-id',
  currentTime: 180.0
})
```

**Событие для других участников:**
```javascript
socket.on('video:seek', (data) => {
  // data: { currentTime, timestamp }
})
```

### Запрос синхронизации
```javascript
socket.emit('video:sync_request', roomId)
```

**Ответ:**
```javascript
socket.on('video:sync', (state) => {
  // state: { currentTime, isPlaying, timestamp }
})
```

### Покинуть комнату
```javascript
socket.emit('room:leave', roomId)
```

## Пример использования на фронтенде

```javascript
import io from 'socket.io-client'

const socket = io('http://localhost:PORT')
const roomId = 'room-id-from-api'

// Присоединиться к комнате
socket.emit('room:join', roomId)

// Получить текущее состояние
socket.on('video:state', (state) => {
  // Синхронизировать видео
  videoElement.currentTime = state.currentTime
  if (state.isPlaying) {
    videoElement.play()
  }
})

// Слушать события от других участников
socket.on('video:play', (data) => {
  videoElement.currentTime = data.currentTime
  videoElement.play()
})

socket.on('video:pause', (data) => {
  videoElement.currentTime = data.currentTime
  videoElement.pause()
})

socket.on('video:seek', (data) => {
  videoElement.currentTime = data.currentTime
})

// Отправлять события
videoElement.addEventListener('play', () => {
  socket.emit('video:play', {
    roomId,
    currentTime: videoElement.currentTime
  })
})

videoElement.addEventListener('pause', () => {
  socket.emit('video:pause', {
    roomId,
    currentTime: videoElement.currentTime
  })
})

videoElement.addEventListener('seeked', () => {
  socket.emit('video:seek', {
    roomId,
    currentTime: videoElement.currentTime
  })
})
```

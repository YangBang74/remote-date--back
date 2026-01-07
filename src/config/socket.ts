export const socketConfig = {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
}

// Экспорт по умолчанию, чтобы корректно работать с импортом `import socketConfig from '../config/socket'`
export default socketConfig

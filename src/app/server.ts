import express from 'express'
import http from 'http'
import cors from 'cors'
import routes from './routes'
import { initSocket } from './socket'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api', routes)

const server = http.createServer(app)

// init socket
initSocket(server)

export { server }

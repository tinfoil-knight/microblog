import express, { Application } from 'express'
import 'express-async-errors'
import {
	requestLogger,
	unknownEndpoint,
	errorHandler,
	limiter,
} from './utils/middleware'
import { connectToDb } from './utils/db'
import { isProd, PORT, MONGODB_URI } from './utils/config'
import { userRouter, postRouter } from './controllers'

const app: Application = express()

console.log('NODE_ENV', process.env.NODE_ENV)
console.log('isProduction', isProd)

void connectToDb(MONGODB_URI)

app.set('trust proxy', 1)

app.use(limiter(15, 200))
app.use(requestLogger)
app.use(express.json())

app.get('/health', (_req, res) => {
	res.status(200).json({ status: 'ok' })
})

app.use('/users', userRouter)
app.use('/posts', postRouter)

app.use(errorHandler)
app.use(unknownEndpoint)

app.listen(PORT, () => {
	console.log(`server running on port ${PORT}`)
})

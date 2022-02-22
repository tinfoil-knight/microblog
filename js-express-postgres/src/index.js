const express = require('express')
require('express-async-errors')

const { userRouter, postRouter } = require('./controllers')
const { isProd, PORT, MONGODB_URI } = require('./utils/config')
const { connectToDb } = require('./utils/db')
const {
	requestLogger,
	unknownEndpoint,
	errorHandler,
	limiter,
} = require('./utils/middleware')

const app = express()

console.log('NODE_ENV', process.env.NODE_ENV)
console.log('isProduction', isProd)
connectToDb(MONGODB_URI)

app.set('trust proxy', 1)

app.use(limiter(15, 200))
app.use(requestLogger)
app.use(express.json())

app.get('/health', async (_req, res) => {
	res.status(200).json({ status: 'ok' })
})

app.use('/users', userRouter)
app.use('/posts', postRouter)

app.use(errorHandler)
app.use(unknownEndpoint)

app.listen(PORT, () => {
	console.log(`server running on port ${PORT}`)
})

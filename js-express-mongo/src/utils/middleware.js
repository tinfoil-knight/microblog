const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

const { isDev } = require('./config')

morgan.token('req_body', function (req, _) {
	if (['POST', 'PUT'].includes(req.method)) {
		return JSON.stringify(req.body)
	}
})

const logFormat = isDev
	? ':remote-addr :method :url :status - :response-time ms :req_body'
	: ':date[iso] :method :url :status - :response-time ms :req_body'

const requestLogger = morgan(logFormat)

//

const unknownEndpoint = (_, res) => {
	res.status(404).json({ error: 'unknown endpoint' })
}

//

const errorHandler = (err, _req, res, _next) => {
	// mongoose
	if (err.name === 'ValidationError') {
		err.status = 400
	}
	const errStatus = err.status || 500
	const logMessage = errStatus >= 500 ? err : err.message
	console.log(logMessage, err.props || '')
	const errMessage = errStatus >= 500 ? 'internal server error' : err.message
	const responseObj = { error: errMessage }
	if (err.props) {
		responseObj.details = err.props
	}
	res.status(errStatus).json(responseObj)
}

//

const limiter = (minutes, limit) =>
	rateLimit({
		windowMs: minutes * 60 * 1000,
		max: limit,
		message: 'Too many requests from this IP, please try again later.\n',
	})

module.exports = {
	requestLogger,
	unknownEndpoint,
	errorHandler,
	limiter,
}

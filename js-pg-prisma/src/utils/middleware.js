const rateLimit = require('express-rate-limit')
const morgan = require('morgan')

const log = require('./log')

morgan.token('req_body', function (req, _) {
	if (['POST', 'PUT'].includes(req.method)) {
		return JSON.stringify(req.body)
	}
})

const jsonFormat = (tokens, req, res) => {
	return JSON.stringify(
		':method :url :status :response-time :req_body'
			.replaceAll(':', '')
			.split(' ')
			.reduce((a, b) => {
				a[b] = tokens[b](req, res)
				return a
			}, {})
	)
}

// const logFormat =
// 	':date[iso] :method :url :status - :response-time ms :req_body'

const requestLogger = morgan(jsonFormat, {
	stream: {
		write: data => log.http(JSON.parse(data)),
	},
})

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
	log.error({
		message: err.message,
		details: err.props || '',
		stack: errStatus == 500 ? err.stack : '',
	})
	const errMessage = errStatus == 500 ? 'internal server error' : err.message
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

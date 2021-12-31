import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import { Request, Response, NextFunction } from 'express'

import { isDev } from './config'
import HttpError from './error'

morgan.token('req_body', function (req, _) {
	if (['POST', 'PUT'].includes(req.method!)) {
		// @ts-expect-error
		return JSON.stringify(req.body)
	}
})

const logFormat = isDev
	? ':remote-addr :method :url :status - :response-time ms :req_body'
	: ':date[iso] :method :url :status - :response-time ms :req_body'

const requestLogger = morgan(logFormat)

//

const unknownEndpoint = (_: Request, res: Response) => {
	res.status(404).json({ error: 'unknown endpoint' })
}

//

const errorHandler = (
	err: HttpError,
	_req: Request,
	res: Response,
	_next: NextFunction
) => {
	// mongoose
	if (err.name === 'ValidationError') {
		err.status = 400
	}
	if (
		err.name === 'MongoServerError' &&
		err.message.includes('duplicate key error')
	) {
		err.status = 400
	}
	const errStatus = err.status || 500
	const logMessage = errStatus >= 500 ? err : err.message
	console.log(logMessage, err.props || '')
	const errMessage = errStatus >= 500 ? 'internal server error' : err.message
	interface ResponseObj {
		error: string
		details?: any
	}
	const responseObj: ResponseObj = { error: errMessage }
	if (err.props) {
		responseObj.details = err.props
	}
	res.status(errStatus).json(responseObj)
}

//

const limiter = (minutes: number, limit: number) =>
	rateLimit({
		windowMs: minutes * 60 * 1000,
		max: limit,
		message: 'Too many requests from this IP, please try again later.\n',
	})

export { requestLogger, unknownEndpoint, errorHandler, limiter }

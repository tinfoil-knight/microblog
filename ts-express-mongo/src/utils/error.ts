import status from 'statuses'

class HttpError extends Error {
	constructor(statusCode, message, props) {
		const msg = message ? message : status(statusCode)
		super(msg)
		this.status = statusCode
		this.props = props
		Error.captureStackTrace(this, HttpError)
	}
}

export default HttpError

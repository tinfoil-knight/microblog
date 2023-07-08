const status = require('statuses')

class HttpError extends Error {
	constructor(statusCode, message, props) {
		const msg = message || status(statusCode)
		super(msg)
		this.status = statusCode
		this.props = props
		Error.captureStackTrace(this, HttpError)
	}
}

module.exports = HttpError

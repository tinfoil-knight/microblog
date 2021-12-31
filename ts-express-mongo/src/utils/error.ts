import status from 'statuses'

class HttpError extends Error {
	status: any
	props: any
	constructor(statusCode: number, message?: string, props?: any) {
		const msg = message ? message : status(statusCode)
		super(String(msg))
		this.status = statusCode
		this.props = props
		Error.captureStackTrace(this, HttpError)
	}
}

export default HttpError

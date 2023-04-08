import status from 'statuses'

type Props = Record<string, unknown> | undefined

class HttpError extends Error {
	status: number
	props: Props
	constructor(statusCode: number, message?: string, props?: Props) {
		const msg = message ? message : status(statusCode)
		super(String(msg))
		this.status = statusCode
		this.props = props
		Error.captureStackTrace(this, HttpError)
	}
}

export default HttpError

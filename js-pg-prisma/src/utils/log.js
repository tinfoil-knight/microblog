const { createLogger, format, transports } = require('winston')

const { isDev } = require('./config')

const log = new createLogger({
	level: isDev ? 'debug' : 'http',
	transports: [
		new transports.Console({
			handleExceptions: true,
			json: true,
		}),
	],
	levels: {
		error: 0,
		warn: 1,
		info: 2,
		http: 3,
		debug: 4,
	},
	format: format.combine(
		format.timestamp(),
		format.json(),
		format.prettyPrint()
	),
	exitOnError: false,
})

module.exports = log

const mongoose = require('mongoose')

const mongoOptions = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	autoIndex: false,
}

const connectToDb = async mongoUri => {
	console.log(`mongoUri: ${mongoUri}`)
	try {
		await mongoose.connect(mongoUri, mongoOptions)
		// Note: Enables validators on update requests
		// To prevent for a update query use runValidators: false in opts
		mongoose.set('runValidators', true)
		console.log('connected to MongoDB')
	} catch (err) {
		console.log('error connecting to MongoDB:', err.message)
		console.log('shutting down the server')
		// eslint-disable-next-line
		process.exit(0)
	}
}

module.exports = { connectToDb }

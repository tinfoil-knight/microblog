import mongoose from 'mongoose'

const mongoOptions = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	autoIndex: false,
}

const connectToDb = async (mongoUri: string) => {
	console.log(`mongoUri: ${mongoUri}`)
	try {
		await mongoose.connect(mongoUri, mongoOptions)
		console.log('connected to MongoDB')
	} catch (err) {
		console.log('error connecting to MongoDB:', err.message)
		console.log('shutting down the server')
		// eslint-disable-next-line
		process.exit(0)
	}
}

export { connectToDb }

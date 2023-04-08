const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			maxLength: 50,
			minLength: 3,
		},
		email: { type: String, required: true, unique: true, maxLength: 100 },
		passwordHash: { type: String, required: true, select: false },
	},
	{ timestamps: true }
)

module.exports = mongoose.model('User', userSchema)

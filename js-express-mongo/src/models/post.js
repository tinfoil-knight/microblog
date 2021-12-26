const mongoose = require('mongoose')

const postSchema = new mongoose.Schema(
	{
		content: { type: String },
		author: { type: String },
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
)

module.exports = mongoose.model('Post', postSchema)

const mongoose = require('mongoose')

const likeSchema = new mongoose.Schema(
	{
		post: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'Post',
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'User',
		},
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
)

likeSchema.index({ post: 1, user: 1 }, { unique: true })

module.exports = mongoose.model('Like', likeSchema)

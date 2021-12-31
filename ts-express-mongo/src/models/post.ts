import mongoose from 'mongoose'

const postSchema = new mongoose.Schema(
	{
		content: { type: String, required: true },
		author: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'User',
		},
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
)

export default mongoose.model('Post', postSchema)

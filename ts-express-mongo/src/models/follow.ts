import mongoose from 'mongoose'

const followSchema = new mongoose.Schema(
	{
		follower: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'User',
			index: true,
		},
		following: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'User',
			index: true,
		},
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
)

followSchema.index({ follower: 1, following: 1 }, { unique: true })

export default mongoose.model('Follow', followSchema)

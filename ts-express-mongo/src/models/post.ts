import mongoose from 'mongoose'

interface IPost extends mongoose.Document {
	content: string
	author: mongoose.Schema.Types.ObjectId
}

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

export default mongoose.model<IPost>('Post', postSchema)

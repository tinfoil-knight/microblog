import { Document, Schema, Model, model } from 'mongoose'

import { IUser } from './user'
import { IPost } from './post'

const likeSchema = new Schema(
	{
		post: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'Post',
			index: true,
		},
		user: {
			type: Schema.Types.ObjectId,
			required: true,
			ref: 'User',
			index: true,
		},
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
)

likeSchema.index({ post: 1, user: 1 }, { unique: true })

interface BaseLike extends Document {
	readonly createdAt: Date
}

export interface ILike extends BaseLike {
	post: IPost['_id']
	user: IUser['_id']
}

export interface IPLike extends BaseLike {
	post: IPost
	user: IUser
}

export default model<ILike, Model<ILike>>('Like', likeSchema)

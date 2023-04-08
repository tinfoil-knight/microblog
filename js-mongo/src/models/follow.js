const mongoose = require('mongoose')

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
			validate: {
				validator: v => {
					// TODO: check if both string or ObjectIDs
					return this.follower != v
				},
				message: 'follower and following can not be same',
			},
		},
	},
	{ timestamps: { createdAt: true, updatedAt: false } }
)

followSchema.index({ follower: 1, following: 1 }, { unique: true })

module.exports = mongoose.model('Follow', followSchema)

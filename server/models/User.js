const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  avatar: { type: String, default: '' },
  isApproved: { type: Boolean, default: false },
  contacts: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = model('User', userSchema);
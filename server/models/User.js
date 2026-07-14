const { Schema, model } = require('mongoose');
const userSchema = new Schema({
  email:    { type: String, required: true, unique: true, lowercase: true },
  name:     { type: String, required: true },
  password: { type: String, required: true }, // bcrypt-хеш
  avatar:   { type: String, default: '' },    // Cloudinary URL
  verified: { type: Boolean, default: false },
  verifyToken: String,
  verifyExp:  Date,
}, { timestamps: true });
module.exports = model('User', userSchema);
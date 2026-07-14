const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    lowercase: true // Чтобы "Admin" и "admin" были одним и тем же
  },
  password: { type: String, required: true },
  name: { type: String, required: true }, // Отображаемое имя
  avatar: { type: String, default: '' },
  isApproved: { type: Boolean, default: false }, // Флаг одобрения админом
  contacts: [{ type: Schema.Types.ObjectId, ref: 'User' }] // Список друзей
}, { timestamps: true });

module.exports = model('User', userSchema);
const { Schema, model } = require('mongoose');

const messageSchema = new Schema({
  chatId: { type: String, required: true, index: true }, // ID чата или комнаты
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true }); // createdAt и updatedAt добавятся автоматически

module.exports = model('Message', messageSchema);
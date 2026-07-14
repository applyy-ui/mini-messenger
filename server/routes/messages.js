const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Получить сообщения конкретного чата
router.get('/:chatId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name avatar username');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка получения сообщений' });
  }
});

// Создать сообщение (резервный роут, если сокет не сработал)
router.post('/', auth, async (req, res) => {
  try {
    const { chatId, text } = req.body;
    const message = new Message({ chatId, senderId: req.userId, text });
    await message.save();
    const populated = await Message.findById(message._id).populate('senderId', 'name avatar username');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
});

module.exports = router;
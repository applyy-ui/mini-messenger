const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Получить историю сообщений для конкретного чата
router.get('/:chatId', auth, async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .sort({ createdAt: 1 }) // Сортировка от старых к новым
      .populate('senderId', 'name avatar'); // Подтягиваем имя и аватар отправителя
    
    res.json(messages);
    } catch (error) {
    res.status(500).json({ error: 'Ошибка получения сообщений' });
  }
});

// Создать сообщение в БД (используется как фолбэк или для начальной загрузки)
router.post('/', auth, async (req, res) => {
  try {
    const { chatId, text } = req.body;
    
    const message = new Message({
      chatId,
      senderId: req.userId,
      text
    });
    
    await message.save();
    
    // Возвращаем сообщение с данными отправителя
    const populatedMessage = await Message.findById(message._id).populate('senderId', 'name avatar');
    res.json(populatedMessage);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Получить список всех чатов пользователя
router.get('/', auth, async (req, res) => {
  try {
    // Ищем все сообщения, где chatId содержит ID текущего пользователя
    const messages = await Message.find({
      chatId: { $regex: req.userId }
    }).sort({ createdAt: -1 }); // Сортируем от новых к старым, чтобы взять последнее сообщение

    const chatMap = new Map();
    const currentUser = await User.findById(req.userId);

    for (const msg of messages) {
      if (chatMap.has(msg.chatId)) continue; // Если чат уже добавлен, пропускаем (берем только последнее сообщение)
      
      const parts = msg.chatId.split('_');
      const partnerId = parts[0] === req.userId ? parts[1] : parts[0];
      const isFavorite = parts[0] === parts[1];
      
      const partner = isFavorite ? currentUser : await User.findById(partnerId).select('username name avatar');
      if (!partner) continue;

      chatMap.set(msg.chatId, {
        chatId: msg.chatId,
        name: isFavorite ? 'Избранное' : partner.name,
        username: partner.username,
        avatar: partner.avatar || partner.username[0].toUpperCase(),
        partnerId: partnerId,
        lastMessage: msg.text,
        lastTime: new Date(msg.createdAt).toLocaleTimeString('ru', {hour:'2-digit', minute:'2-digit'}),
        isFavorite
      });
    }

    res.json(Array.from(chatMap.values()));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка загрузки чатов' });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.get('/', async (req, res) => {
  try {
    // 1. Получаем токен из заголовка
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Нет токена авторизации' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Проверяем и расшифровываем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Ищем пользователя в базе (исключая пароль и токены подтверждения)
    const user = await User.findById(decoded.userId).select('-password -verifyToken -verifyExp');
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // 4. Возвращаем безопасные данные пользователя
    res.json({ 
      user: { 
        id: user._id,
        username: user.username || user.email, // Если username нет, используем email
        name: user.name, 
        email: user.email,
        avatar: user.avatar || '',
        isAdmin: user.isAdmin || false, // <-- ГЛАВНОЕ ДОБАВЛЕНИЕ
        isApproved: user.isApproved !== undefined ? user.isApproved : true
      } 
    });
  } catch (error) {
    console.error('Ошибка профиля:', error);
    res.status(401).json({ error: 'Неверный или просроченный токен' });
  }
});

module.exports = router;    
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Поиск пользователя по логину
router.get('/search', auth, async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Введите логин' });

    const user = await User.findOne({ username: username.toLowerCase() })
      .select('username name avatar _id isApproved');
      
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
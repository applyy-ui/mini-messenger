const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Простой роут для одобрения пользователя по логину
// В будущем сюда можно добавить проверку пароля админа
router.post('/approve', async (req, res) => {
  try {
    const { username, adminSecret } = req.body;

    // Простая защита: секретный код должен совпадать с тем, что в .env
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(403).json({ error: 'Неверный секретный код админа' });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    if (user.isApproved) {
      return res.json({ msg: 'Пользователь уже одобрен' });
    }

    user.isApproved = true;
    await user.save();

    res.json({ ok: true, msg: `Пользователь ${username} успешно одобрен!` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
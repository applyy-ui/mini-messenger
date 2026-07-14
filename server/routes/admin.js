const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/approve', async (req, res) => {
  try {
    const { username, adminSecret } = req.body;
    if (adminSecret !== process.env.ADMIN_SECRET) return res.status(403).json({ error: 'Неверный код' });

    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    user.isApproved = true;
    await user.save();
    res.json({ ok: true, msg: `Пользователь ${username} одобрен!` });
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
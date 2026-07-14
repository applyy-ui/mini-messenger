const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Получить список неподтвержденных пользователей (только для админа)
router.get('/pending', auth, async (req, res) => {
  try {
    const requester = await User.findById(req.userId);
    if (!requester || !requester.isAdmin) return res.status(403).json({ error: 'Доступ запрещен' });

    const pendingUsers = await User.find({ isApproved: false }).select('username name createdAt');
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Одобрить пользователя (только для админа)
router.post('/approve', auth, async (req, res) => {
  try {
    const requester = await User.findById(req.userId);
    if (!requester || !requester.isAdmin) return res.status(403).json({ error: 'Доступ запрещен' });

    const { username } = req.body;
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
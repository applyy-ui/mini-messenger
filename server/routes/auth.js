const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const { username, name, password } = req.body;
    if (!username || !name || !password) return res.status(400).json({ error: 'Заполните все поля' });

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) return res.status(400).json({ error: 'Этот логин уже занят' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ username: username.toLowerCase(), name, password: hashedPassword, isApproved: false });
    await user.save();

    res.json({ ok: true, msg: 'Заявка отправлена! Администратор скоро подтвердит ваш аккаунт.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'Неверный логин или пароль' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Неверный логин или пароль' });

    if (!user.isApproved) return res.status(403).json({ error: 'Ваш аккаунт еще не подтвержден администратором' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ ok: true, token, user: { id: user._id, username: user.username, name: user.name, avatar: user.avatar } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
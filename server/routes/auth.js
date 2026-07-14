const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendVerifyMail } = require('../mail');

// 1. РЕГИСТРАЦИЯ
router.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    // Проверяем, есть ли уже такой пользователь
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Пользователь уже существует' });

    // Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Генерируем токен для подтверждения
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExp = new Date(Date.now() + 3600000); // 1 час

    // Создаем пользователя
    const user = new User({
      email,
      name,
      password: hashedPassword,
      verifyToken,
      verifyExp
    });
    await user.save();

    // Формируем ссылку для подтверждения (указывает на наш же бэкенд)
    const verifyLink = `http://localhost:4000/api/auth/verify?email=${encodeURIComponent(email)}&token=${verifyToken}`;

    // Отправляем письмо
    await sendVerifyMail(email, verifyLink);

    res.json({ ok: true, msg: 'Письмо отправлено' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 2. ПОДТВЕРЖДЕНИЕ ПОЧТЫ (GET запрос по ссылке из письма)
router.get('/verify', async (req, res) => {
  try {
    const { email, token } = req.query;

    const user = await User.findOne({ email, verifyToken: token });
    
    if (!user) {
      return res.status(400).send('<h1>Ошибка</h1><p>Неверная или просроченная ссылка</p>');
    }

    if (user.verifyExp < Date.now()) {
      return res.status(400).send('<h1>Ошибка</h1><p>Срок действия ссылки истек</p>');
    }

    // Подтверждаем пользователя
    user.verified = true;
    user.verifyToken = undefined;
    user.verifyExp = undefined;
    await user.save();

    res.send('<h1>✅ Почта успешно подтверждена!</h1><p>Теперь вы можете войти в систему.</p>');
  } catch (error) {
    console.error(error);
    res.status(500).send('<h1>Ошибка сервера</h1>');
  }
});

// 3. ВХОД (LOGIN)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Неверный email или пароль' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Неверный email или пароль' });

    if (!user.verified) {
      return res.status(403).json({ error: 'Подтвердите почту' });
    }

    // Генерируем JWT токен
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      ok: true, 
      token, 
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
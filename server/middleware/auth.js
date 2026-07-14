const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Нет токена авторизации' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Добавляем ID пользователя в объект запроса, чтобы роуты могли его использовать
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Неверный или просроченный токен' });
  }
};
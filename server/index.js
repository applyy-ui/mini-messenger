require('dotenv').config();
console.log('ENV CHECK:', process.env.MONGO_URI);
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDb = require('./db');

const app = express();

// Разрешаем запросы отовсюду (для разработки и GitHub Pages)
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));

// Подключаем все роуты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./middleware/auth'), require('./routes/profile'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/chats', require('./routes/chats')); // <-- НОВЫЙ РОУТ

const server = http.createServer(app);

// Настройка Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Инициализация сокетов
require('./sockets')(io);

(async () => {
  await connectDb();
  server.listen(process.env.PORT || 4000, () => console.log('🚀 ready'));
})();
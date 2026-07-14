require('dotenv').config();
console.log('ENV CHECK:', process.env.MONGO_URI);
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDb = require('./db');

const app = express();

// Разрешаем запросы со всех локальных адресов для разработки
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./middleware/auth'), require('./routes/profile'));
app.use('/api/admin', require('./routes/admin'));

const server = http.createServer(app);

// Socket.io — разрешаем все локальные адреса
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"],
    credentials: true
  }
});

require('./sockets')(io);

(async () => {
  await connectDb();
  server.listen(process.env.PORT || 4000, () => console.log('🚀 ready'));
})();
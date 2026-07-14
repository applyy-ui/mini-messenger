const Message = require('./models/Message');
const User = require('./models/User');

// Храним онлайн-пользователей: { userId: socketId }
const onlineUsers = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🟢 Пользователь подключился:', socket.id);

    // --- ПОЛЬЗОВАТЕЛЬ АВТОРИЗОВАЛСЯ ---
    socket.on('userOnline', async (userId) => {
      // Сохраняем связь userId -> socket.id
      onlineUsers.set(userId, socket.id);
      
      // Обновляем статус в БД (если есть поле isOnline)
      try {
        await User.findByIdAndUpdate(userId, { 
          lastSeen: new Date(),
          isOnline: true 
        });
      } catch (e) {
        console.error('Ошибка обновления статуса:', e);
      }
      
      // Сообщаем всем, что пользователь онлайн
      socket.broadcast.emit('userStatus', { 
        userId, 
        status: 'online' 
      });
      
      console.log(`👤 Пользователь ${userId} онлайн`);
    });

    // --- ПРИСОЕДИНЕНИЕ К КОМНАТЕ ЧАТА ---
    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
      console.log(`Пользователь ${socket.id} вошел в чат ${chatId}`);
    });

    // --- ОТПРАВКА СООБЩЕНИЯ ---
    socket.on('sendMessage', async (data) => {
      try {
        const { chatId, text, senderId, partnerId, tempId } = data;

        const newMessage = new Message({ chatId, senderId, text });
        const savedMessage = await newMessage.save();
        
        const populatedMessage = await Message.findById(savedMessage._id)
          .populate('senderId', 'name avatar username');

        // Подтверждение для отправителя
        socket.emit('messageSent', { 
          _id: savedMessage._id, 
          chatId, 
          tempId: tempId || null 
        });

        // Отправляем сообщение всем в комнате чата
        io.to(chatId).emit('newMessage', populatedMessage);

        // Отправляем событие новому чату партнеру (если он онлайн)
        const sender = await User.findById(senderId).select('username name avatar');
        io.to(partnerId).emit('newChat', {
          chatId,
          partnerId: senderId,
          name: sender.name,
          username: sender.username,
          avatar: sender.avatar || sender.username[0].toUpperCase(),
          lastMessage: text,
          lastTime: new Date(savedMessage.createdAt).toLocaleTimeString('ru', {hour:'2-digit', minute:'2-digit'})
        });

      } catch (error) {
        console.error('Ошибка сохранения сообщения:', error);
        socket.emit('error', { message: 'Не удалось отправить сообщение' });
      }
    });

    // --- ИНДИКАТОР ПЕЧАТАНИЯ ---
    socket.on('typing', ({ chatId, username }) => {
      // Отправляем событие ВСЕМ в комнате, кроме отправителя
      socket.to(chatId).emit('userTyping', { 
        chatId, 
        username 
      });
    });

    // --- ОТКЛЮЧЕНИЕ ---
    socket.on('disconnect', async () => {
      console.log('🔴 Пользователь отключился:', socket.id);
      
      // Находим userId по socket.id
      let disconnectedUserId = null;
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          break;
        }
      }
      
      if (disconnectedUserId) {
        // Удаляем из Map
        onlineUsers.delete(disconnectedUserId);
        
        // Обновляем статус в БД
        try {
          await User.findByIdAndUpdate(disconnectedUserId, { 
            lastSeen: new Date(),
            isOnline: false 
          });
        } catch (e) {
          console.error('Ошибка обновления статуса:', e);
        }
        
        // Сообщаем всем, что пользователь офлайн
        socket.broadcast.emit('userStatus', { 
          userId: disconnectedUserId, 
          status: 'offline' 
        });
        
        console.log(`👤 Пользователь ${disconnectedUserId} офлайн`);
      }
    });
  });
};
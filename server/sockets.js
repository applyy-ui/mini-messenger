const Message = require('./models/Message');
const User = require('./models/User');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🟢 Пользователь подключился:', socket.id);

    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
      console.log(`Пользователь ${socket.id} вошел в чат ${chatId}`);
    });

    socket.on('sendMessage', async (data) => {
      try {
        const { chatId, text, senderId, partnerId, tempId } = data;

        const newMessage = new Message({ chatId, senderId, text });
        const savedMessage = await newMessage.save();
        
        const populatedMessage = await Message.findById(savedMessage._id)
          .populate('senderId', 'name avatar username');

        // Подтверждение для отправителя с реальным _id
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

    socket.on('disconnect', () => {
      console.log('🔴 Пользователь отключился:', socket.id);
    });
  });
};
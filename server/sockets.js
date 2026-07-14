const Message = require('./models/Message');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🟢 Пользователь подключился:', socket.id);

    // Вход в комнату чата
    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
      console.log(`Пользователь ${socket.id} вошел в чат ${chatId}`);
    });

    // Отправка сообщения
    socket.on('sendMessage', async (data) => {
      try {
        const { chatId, text, senderId, partnerId } = data;

        // Сохраняем в БД
        const newMessage = new Message({ chatId, senderId, text });
        const savedMessage = await newMessage.save();
        
        // Подтягиваем данные отправителя
        const populatedMessage = await Message.findById(savedMessage._id)
          .populate('senderId', 'name avatar username');

        // Отправляем всем в этой комнате чата
        io.to(chatId).emit('newMessage', populatedMessage);
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
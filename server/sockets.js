const Message = require('./models/Message');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('🟢 Пользователь подключился:', socket.id);

    // 1. Пользователь входит в комнату чата
    socket.on('joinChat', (chatId) => {
      socket.join(chatId);
      console.log(`Пользователь ${socket.id} вошел в чат ${chatId}`);
    });

    // 2. Обработка нового сообщения
    socket.on('sendMessage', async (data) => {
      try {
        const { chatId, text, senderId } = data;

        // Сохраняем сообщение в базу данных
        const newMessage = new Message({
          chatId,
          senderId,
          text
        });

        const savedMessage = await newMessage.save();
        
        // Подтягиваем данные отправителя для фронтенда
        const populatedMessage = await Message.findById(savedMessage._id)
          .populate('senderId', 'name avatar');

        // Отправляем сообщение ВСЕМ в этой комнате чата (включая отправителя)
        io.to(chatId).emit('newMessage', populatedMessage);
        
      } catch (error) {
        console.error('Ошибка сохранения сообщения:', error);
        socket.emit('error', { message: 'Не удалось отправить сообщение' });
      }
    });

    // 3. Отключение
    socket.on('disconnect', () => {
      console.log('🔴 Пользователь отключился:', socket.id);
    });
  });
};
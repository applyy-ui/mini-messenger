const API = 'https://your-api.onrender.com/api';
const token = localStorage.getItem('token');

// Вход
async function login(email, password) {
  const r = await fetch(API + '/auth/login', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, password })
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error);
  localStorage.setItem('token', data.token);
  return data.user;
}

// Сокет
const socket = io('https://your-api.onrender.com', { auth: { token } });
socket.on('msg', async (m) => {
  const text = await decrypt(m.cipher, m.iv, m.chatId);
  addMessageToUI(m.chatId, { text, own: m.from === currentUser.email });
});

async function send(text, chatId) {
  const { cipher, iv } = await encrypt(text, chatId);
  socket.emit('msg', { chatId, cipher, iv });
}
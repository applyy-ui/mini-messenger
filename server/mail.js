async function sendVerifyMail(to, link) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to,
      subject: 'Подтверждение регистрации',
      html: `<h2>Привет!</h2><p><a href="${link}">Подтвердить почту</a></p>`
    })
  });
}
module.exports = { sendVerifyMail };
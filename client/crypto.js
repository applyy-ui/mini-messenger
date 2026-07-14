async function deriveKey(chatId) {
  // Для демо: детерминированный ключ из chatId. В проде — обмен ключами.
  const buf = new TextEncoder().encode('salt-' + chatId);
  const base = await crypto.subtle.importKey('raw', buf, 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new Uint8Array(16), iterations: 100000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
}
async function encrypt(text, chatId) {
  const key = await deriveKey(chatId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, new TextEncoder().encode(text)
  );
  return {
    cipher: btoa(String.fromCharCode(...new Uint8Array(ct))),
    iv:     btoa(String.fromCharCode(...iv))
  };
}
async function decrypt(cipherB64, ivB64, chatId) {
  const key = await deriveKey(chatId);
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0));
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}
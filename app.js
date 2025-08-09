// app.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(console.error);
  });
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.querySelectorAll('[data-install]').forEach((btn) => (btn.style.display = 'inline-block'));
});
function installPWA() {
  if (deferredPrompt) deferredPrompt.prompt();
}

function saveProfile(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  localStorage.setItem('shiftstrong_profile', JSON.stringify(data));
  window.location.href = 'dashboard.html';
  return false;
}
function getProfile() {
  try {
    return JSON.parse(localStorage.getItem('shiftstrong_profile')) || {};
  } catch (e) {
    return {};
  }
}

function messageTypeByHour(h = new Date().getHours()) {
  if (h < 12) return 'morning';
  if (h < 18) return 'midshift';
  return 'winddown';
}

const BACKEND_URL = 'https://shiftstrong-message.YOURNAME.workers.dev/message';

async function renderDashboard() {
  const profile = getProfile();
  const name = profile.firstName || 'Friend';
  const role = profile.role || 'healthcare pro';
  const type = messageTypeByHour();

  const elName = document.querySelector('[data-name]');
  const elRole = document.querySelector('[data-role]');
  if (elName) elName.textContent = name;
  if (elRole) elRole.textContent = role;

  let fallback = '';
  if (type === 'morning')
    fallback = `Morning, ${name}. First break is sacred — 10 minutes to breathe will buy you an hour of clarity.`;
  else if (type === 'midshift')
    fallback = `Mid-shift reset: inhale 4, hold 4, exhale 6 — repeat x3. You’ve got this.`;
  else fallback = `You carried a lot today. Water + 60s shoulder stretch before bed. Tiny ritual, big recovery.`;

  const target = document.querySelector('[data-message]');
  if (!target) return;

  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile, messageType: type })
    });
    if (!res.ok) throw new Error('Bad response');
    const data = await res.json();
    target.textContent = (data.message || '').trim() || fallback;
  } catch (e) {
    console.warn('Backend error:', e);
    target.textContent = fallback;
  }
}

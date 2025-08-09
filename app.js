
// Register service worker (relative path for subpaths)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(console.error);
  });
}

// PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  document.querySelectorAll('[data-install]').forEach(btn => btn.style.display = 'inline-block');
});
function installPWA(){ if (deferredPrompt) deferredPrompt.prompt(); }

// Simple localStorage profile
function saveProfile(form){
  const data = Object.fromEntries(new FormData(form).entries());
  localStorage.setItem('shiftstrong_profile', JSON.stringify(data));
  window.location.href = 'dashboard.html';
  return false;
}
function getProfile(){
  try { return JSON.parse(localStorage.getItem('shiftstrong_profile')) || {}; }
  catch(e){ return {}; }
}

function messageTypeByHour(h = (new Date()).getHours()){
  if (h < 12) return 'morning';
  if (h < 18) return 'midshift';
  return 'winddown';
}

// Backend endpoint (set via localStorage for flexibility)
const BACKEND_URL = localStorage.getItem('shiftstrong_backend') || 'https://YOUR_WORKER_SUBDOMAIN.workers.dev/message';

async function renderDashboard(){
  const profile = getProfile();
  const name = profile.firstName || 'Friend';
  const role = profile.role || 'healthcare pro';
  document.querySelector('[data-name]').textContent = name;
  document.querySelector('[data-role]').textContent = role;

  const type = messageTypeByHour();
  let fallback = '';
  if (type === 'morning') fallback = `Morning, ${name}. First break is sacred — 10 minutes to breathe will buy you an hour of clarity.`;
  else if (type === 'midshift') fallback = `Mid-shift reset: inhale 4, hold 4, exhale 6 — repeat x3. You’ve got this.`;
  else fallback = `You carried a lot today. Water + 60s shoulder stretch before bed. Tiny ritual, big recovery.`;

  try {
    const res = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ profile, messageType: type })
    });
    if (!res.ok) throw new Error('Bad response');
    const data = await res.json();
    document.querySelector('[data-message]').textContent = (data.message || '').trim() || fallback;
  } catch (e){
    console.warn('Backend error:', e);
    document.querySelector('[data-message]').textContent = fallback;
  }
}

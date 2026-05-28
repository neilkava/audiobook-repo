const emojis = ['🌸', '🌼', '🌺'];
let last = 0;

export function init() {
  const footer = document.querySelector('footer');
  if (!footer) return;
  footer.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - last < 50) return;
    last = now;
    const el = document.createElement('span');
    el.className = 'footer-particle';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = (e.clientX + (Math.random() - 0.5) * 16) + 'px';
    el.style.top = (e.clientY + (Math.random() - 0.5) * 16) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  });
}

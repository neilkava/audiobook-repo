import { state } from '../foundation/state.js';
import { CONFIG } from '../../config.js';
import { formatTime } from '../foundation/utils.js';
import { PLAY_ICON, PAUSE_ICON } from '../foundation/icons.js';
import { bus } from '../foundation/event-bus.js';

let listEl;
let onSelect = null;

export function init(callbacks) {
  if (callbacks.onSelect) onSelect = callbacks.onSelect;
  listEl = document.getElementById('chapterList');

  bus.on('audio:playstate', () => syncIndicators());
  bus.on('chapter:change', () => syncIndicators());
  bus.on('intro:change', () => syncIndicators());
}

export function render() {
  listEl.innerHTML = '';
  CONFIG.chapters.forEach((ch, i) => {
    const btn = document.createElement('button');
    btn.className = 'chapter-btn' + (i === state.currentIndex ? ' active' : '');
    const isActive = i === state.currentIndex && state.isPlaying;
    btn.innerHTML = `
      <span class="num">${String(i + 1).padStart(2, '0')}</span>
      <span class="info">
        <div class="title">${ch.title}</div>
        <div class="duration">${ch.dur}</div>
      </span>
      <span class="play-indicator">${createIndicator(isActive)}</span>
    `;
    btn.addEventListener('click', () => onSelect?.(i));
    listEl.appendChild(btn);
  });
}

export function syncIndicators() {
  document.querySelectorAll('.chapter-btn').forEach((el, idx) => {
    el.classList.toggle('active', idx === state.currentIndex);
    const ind = el.querySelector('.play-indicator');
    if (ind) {
      ind.innerHTML = createIndicator(idx === state.currentIndex && state.isPlaying);
    }
  });
}

function createIndicator(isPlaying) {
  return isPlaying ? PAUSE_ICON : PLAY_ICON;
}

export function preloadDurations() {
  CONFIG.chapters.forEach((ch, i) => {
    const tmp = new Audio(ch.file);
    tmp.preload = 'metadata';
    tmp.addEventListener('loadedmetadata', () => {
      ch.dur = formatTime(tmp.duration);
      const durEl = document.querySelectorAll('.chapter-btn .duration')[i];
      if (durEl) durEl.textContent = ch.dur;
    });
  });
}

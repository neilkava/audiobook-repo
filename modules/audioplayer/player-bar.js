import { state } from '../foundation/state.js';
import { CONFIG } from '../../config.js';
import { formatTime } from '../foundation/utils.js';
import { PLAY_ICON, PAUSE_ICON } from '../foundation/icons.js';
import { bus } from '../foundation/event-bus.js';

let playBtn, progressFill, currentTimeEl, totalTimeEl, trackInfoText, trackInfo, trackExpandIcon;

export function init() {
  playBtn = document.getElementById('playBtn');
  progressFill = document.getElementById('progressFill');
  currentTimeEl = document.getElementById('currentTime');
  totalTimeEl = document.getElementById('totalTime');
  trackInfoText = document.getElementById('trackInfoText');
  trackInfo = document.getElementById('trackInfo');
  trackExpandIcon = document.getElementById('trackExpandIcon');

  bus.on('audio:meta', ({ duration }) => {
    totalTimeEl.textContent = formatTime(duration);
    if (state.currentIndex >= 0) {
      updateChapterDuration(state.currentIndex, duration);
    }
  });

  bus.on('audio:timeupdate', ({ currentTime, duration }) => {
    updateProgress(currentTime, duration);
  });

  bus.on('audio:playstate', () => {
    updatePlayButton();
  });

  bus.on('chapter:change', ({ index }) => {
    const ch = CONFIG.chapters[index];
    trackInfoText.textContent = ch.title;
    trackInfo.classList.add('active');
    updatePlayButton();
  });

  bus.on('audio:ended', () => {
    progressFill.style.width = '0%';
    currentTimeEl.textContent = '0:00';
  });

  bus.on('intro:change', () => {
    trackInfoText.textContent = 'Introduction';
    trackInfo.classList.add('active');
    updatePlayButton();
  });
}

function updatePlayButton() {
  playBtn.innerHTML = state.isPlaying ? PAUSE_ICON : PLAY_ICON;
}

function updateProgress(currentTime, duration) {
  if (!duration) return;
  const pct = (currentTime / duration) * 100;
  progressFill.style.width = Math.min(pct, 100) + '%';
  currentTimeEl.textContent = formatTime(currentTime);
}

function updateChapterDuration(index, duration) {
  CONFIG.chapters[index].dur = formatTime(duration);
  const durEl = document.querySelectorAll('.chapter-btn .duration')[index];
  if (durEl) durEl.textContent = CONFIG.chapters[index].dur;
}

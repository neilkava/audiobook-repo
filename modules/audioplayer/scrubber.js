import { state } from '../foundation/state.js';
import { audio, seekTo } from './engine.js';

export function init() {
  const progressTrack = document.getElementById('progressTrack');

  progressTrack.addEventListener('mousedown', (e) => {
    e.preventDefault();
    state.isDragging = true;
    seekFromEvent(e, progressTrack);
  });

  document.addEventListener('mousemove', (e) => {
    if (!state.isDragging) return;
    seekFromEvent(e, progressTrack);
  });

  document.addEventListener('mouseup', () => {
    state.isDragging = false;
  });
}

function seekFromEvent(e, track) {
  const rect = track.getBoundingClientRect();
  if (!audio.duration) return;
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  seekTo(x * audio.duration);
}

import { state } from '../foundation/state.js';
import { CONFIG } from '../../config.js';
import { bus } from '../foundation/event-bus.js';

export const audio = new Audio();

export function init() {
  audio.addEventListener('loadedmetadata', () => {
    bus.emit('audio:meta', { duration: audio.duration });
  });
  audio.addEventListener('timeupdate', () => {
    bus.emit('audio:timeupdate', { currentTime: audio.currentTime, duration: audio.duration });
  });
  audio.addEventListener('ended', () => {
    const prevIndex = state.currentIndex;
    state.isPlaying = false;
    bus.emit('audio:playstate', { isPlaying: false });
    if (prevIndex < CONFIG.chapters.length - 1) {
      playChapter(prevIndex + 1);
    } else {
      bus.emit('audio:ended');
    }
  });
  audio.addEventListener('play', () => {
    state.isPlaying = true;
    bus.emit('audio:playstate', { isPlaying: true });
  });
  audio.addEventListener('pause', () => {
    state.isPlaying = false;
    bus.emit('audio:playstate', { isPlaying: false });
  });
}

export function playChapter(i) {
  if (i === state.currentIndex && audio.src) {
    togglePlay();
    return;
  }
  state.currentIndex = i;
  const ch = CONFIG.chapters[i];
  audio.src = ch.file;
  audio.load();
  state.isPlaying = true;
  audio.play().catch(() => {
    state.isPlaying = false;
    bus.emit('audio:playstate', { isPlaying: false });
  });
  bus.emit('chapter:change', { index: i });
  bus.emit('audio:playstate', { isPlaying: true });
}

export function togglePlay() {
  if (state.currentIndex < 0 && !audio.src) { playChapter(0); return; }
  if (audio.paused) {
    state.isPlaying = true;
    audio.play().catch(() => {});
  } else {
    state.isPlaying = false;
    audio.pause();
  }
  bus.emit('audio:playstate', { isPlaying: !audio.paused });
}

export function nextChapter() {
  if (state.currentIndex < CONFIG.chapters.length - 1) playChapter(state.currentIndex + 1);
}

export function prevChapter() {
  if (state.currentIndex > 0) playChapter(state.currentIndex - 1);
}

export function playIntro() {
  state.currentIndex = -1;
  state.isPlaying = true;
  audio.src = 'assets/audio/davidatten.mp3';
  audio.load();
  audio.play().catch(() => {
    state.isPlaying = false;
    bus.emit('audio:playstate', { isPlaying: false });
  });
  bus.emit('intro:change');
  bus.emit('audio:playstate', { isPlaying: true });
}

export function seekTo(time) {
  audio.currentTime = time;
}

export function getCurrentTime() {
  return audio.currentTime;
}

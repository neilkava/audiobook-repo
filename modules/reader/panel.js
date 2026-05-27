import { state } from '../foundation/state.js';
import { CONFIG } from '../../config.js';
import { seekTo, getCurrentTime } from '../audioplayer/engine.js';
import { bus } from '../foundation/event-bus.js';
import { parseTimestampedText, findActiveSegment, highlightSegment, scrollToSegment } from './timestamp-highlight.js';

let readerPanel, readerBackdrop, readerContent, readerTitle, readerCollapseBtn, trackExpandIcon;
let currentReaderSegment = null;
const readerTextCache = {};

export function init() {
  readerPanel = document.getElementById('readerPanel');
  readerBackdrop = document.getElementById('readerBackdrop');
  readerContent = document.getElementById('readerContent');
  readerTitle = document.getElementById('readerTitle');
  readerCollapseBtn = document.getElementById('readerCollapseBtn');
  trackExpandIcon = document.getElementById('trackExpandIcon');

  readerBackdrop.addEventListener('click', close);
  readerCollapseBtn.addEventListener('click', close);

  readerContent.addEventListener('click', (e) => {
    const seg = e.target.closest('.segment');
    if (seg && seg.dataset.start) seekTo(parseFloat(seg.dataset.start));
  });

  bus.on('audio:timeupdate', ({ currentTime }) => {
    syncWithAudio(currentTime);
  });

  bus.on('chapter:change', ({ index }) => {
    if (state.readerOpen) loadChapterText(index);
  });

  bus.on('intro:change', () => {
    close();
  });
}

export function open() {
  if (state.currentIndex < 0) return;
  state.readerOpen = true;
  readerPanel.classList.add('open');
  readerBackdrop.classList.add('open');
  document.body.classList.add('reader-open');
  trackExpandIcon.classList.add('open');
  loadChapterText(state.currentIndex);
}

export function close() {
  state.readerOpen = false;
  readerPanel.classList.remove('open');
  readerBackdrop.classList.remove('open');
  document.body.classList.remove('reader-open');
  trackExpandIcon.classList.remove('open');
}

export function toggle() {
  if (state.readerOpen) close();
  else open();
}

function syncWithAudio(time) {
  if (!state.readerOpen || state.currentIndex < 0) return;
  const activeEl = findActiveSegment(readerContent, time);
  if (!activeEl || activeEl === currentReaderSegment) return;
  highlightSegment(readerContent, activeEl);
  currentReaderSegment = activeEl;
  scrollToSegment(readerContent, activeEl);
}

export async function loadChapterText(index) {
  if (index < 0 || index >= CONFIG.chapters.length) return;
  const ch = CONFIG.chapters[index];
  readerTitle.textContent = ch.title;

  if (readerTextCache[index]) {
    readerContent.innerHTML = readerTextCache[index];
    readerContent.scrollTop = 0;
    currentReaderSegment = null;
    syncWithAudio(getCurrentTime());
    return;
  }

  readerContent.innerHTML = '<p style="opacity:0.4">Loading\u2026</p>';

  try {
    const res = await fetch(ch.textFile);
    if (!res.ok) throw new Error('Not found');
    const text = await res.text();
    const html = parseTimestampedText(text);

    readerTextCache[index] = html;
    readerContent.innerHTML = html;
    currentReaderSegment = null;
    syncWithAudio(getCurrentTime());
  } catch {
    readerContent.innerHTML = '<p style="opacity:0.4">Text not available for this chapter.</p>';
  }
  readerContent.scrollTop = 0;
}

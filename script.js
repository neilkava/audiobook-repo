// ── Audio Player ──

let currentIndex = -1;
let isPlaying = false;

const audio   = new Audio();
const listEl  = document.getElementById('chapterList');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const trackInfo  = document.getElementById('trackInfo');
const progressFill  = document.getElementById('progressFill');
const progressTrack = document.getElementById('progressTrack');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl   = document.getElementById('totalTime');

// ── Reader ──
const readerPanel      = document.getElementById('readerPanel');
const readerBackdrop   = document.getElementById('readerBackdrop');
const readerContent    = document.getElementById('readerContent');
const readerTitle      = document.getElementById('readerTitle');
const readerCollapseBtn = document.getElementById('readerCollapseBtn');
const trackInfoText    = document.getElementById('trackInfoText');
const trackExpandIcon  = document.getElementById('trackExpandIcon');

let readerOpen = false;
let readerTextCache = {};
let currentReaderSegment = null;

function formatTime(s){
  if(!s||!isFinite(s)) return '0:00';
  const m = Math.floor(s/60);
  const sec = Math.floor(s%60);
  return m + ':' + String(sec).padStart(2,'0');
}

function renderChapters(){
  listEl.innerHTML = '';
  CONFIG.chapters.forEach((ch,i)=>{
    const btn = document.createElement('button');
    btn.className = 'chapter-btn' + (i===currentIndex?' active':'');
    btn.innerHTML = `
      <span class="num">${String(i+1).padStart(2,'0')}</span>
      <span class="info">
        <div class="title">${ch.title}</div>
        <div class="duration">${ch.dur}</div>
      </span>
      <span class="play-indicator">${i===currentIndex&&isPlaying?'<svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="1" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="10" y="1" width="4" height="14" rx="1.5" fill="currentColor"/></svg>':'<svg width="14" height="16" viewBox="0 0 14 16"><path d="M1.5 0L13.5 8L1.5 16Z" fill="currentColor"/></svg>'}</span>
    `;
    btn.addEventListener('click',()=>loadChapter(i));
    listEl.appendChild(btn);
  });
}

function loadChapter(i){
  if(i===currentIndex && audio.src){
    togglePlay();
    return;
  }
  currentIndex = i;
  const ch = CONFIG.chapters[i];
  audio.src = ch.file;
  audio.load();
  document.querySelectorAll('.chapter-btn').forEach((el,idx)=>{
    el.classList.toggle('active',idx===i);
    const ind = el.querySelector('.play-indicator');
    if(ind) ind.innerHTML = (idx===i && isPlaying) ? '<svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="1" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="10" y="1" width="4" height="14" rx="1.5" fill="currentColor"/></svg>' : '<svg width="14" height="16" viewBox="0 0 14 16"><path d="M1.5 0L13.5 8L1.5 16Z" fill="currentColor"/></svg>';
  });
  trackInfoText.textContent = ch.title;
  trackInfo.classList.add('active');
  isPlaying = true;
  audio.play().catch(()=>{isPlaying=false;updateUI();});
  if (readerOpen) loadReaderText(i);
  updateUI();
}

function togglePlay(){
  if(currentIndex<0 && !audio.src){loadChapter(0);return}
  if(audio.paused){
    isPlaying=true;
    audio.play().catch(()=>{});
  }else{
    isPlaying=false;
    audio.pause();
  }
  updateUI();
}

function updateUI(){
  playBtn.innerHTML = isPlaying ? '<svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="1" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="10" y="1" width="4" height="14" rx="1.5" fill="currentColor"/></svg>' : '<svg width="14" height="16" viewBox="0 0 14 16"><path d="M1.5 0L13.5 8L1.5 16Z" fill="currentColor"/></svg>';
  document.querySelectorAll('.chapter-btn').forEach((el,i)=>{
    const ind = el.querySelector('.play-indicator');
    if(ind) ind.innerHTML = (i===currentIndex && isPlaying) ? '<svg width="16" height="16" viewBox="0 0 16 16"><rect x="2" y="1" width="4" height="14" rx="1.5" fill="currentColor"/><rect x="10" y="1" width="4" height="14" rx="1.5" fill="currentColor"/></svg>' : '<svg width="14" height="16" viewBox="0 0 14 16"><path d="M1.5 0L13.5 8L1.5 16Z" fill="currentColor"/></svg>';
  });
  if(currentIndex>=0 && CONFIG.chapters[currentIndex]){
    trackInfoText.textContent = CONFIG.chapters[currentIndex].title;
  }
}

function updateProgress(){
  if(!audio.duration) return;
  const pct = (audio.currentTime/audio.duration)*100;
  progressFill.style.width = Math.min(pct,100) + '%';
  currentTimeEl.textContent = formatTime(audio.currentTime);
}

function seek(e){
  const rect = progressTrack.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  if(audio.duration) audio.currentTime = x * audio.duration;
}

audio.addEventListener('loadedmetadata',()=>{
  totalTimeEl.textContent = formatTime(audio.duration);
  if(currentIndex>=0){
    CONFIG.chapters[currentIndex].dur = formatTime(audio.duration);
    const durEl = document.querySelectorAll('.chapter-btn .duration')[currentIndex];
    if(durEl) durEl.textContent = CONFIG.chapters[currentIndex].dur;
  }
});
audio.addEventListener('timeupdate',()=>{updateProgress();syncReaderWithAudio()});
audio.addEventListener('ended',()=>{
  isPlaying=false;
  updateUI();
  if(currentIndex < CONFIG.chapters.length-1){
    loadChapter(currentIndex+1);
  }else{
    progressFill.style.width='0%';
    currentTimeEl.textContent='0:00';
  }
});
audio.addEventListener('play',()=>{isPlaying=true;updateUI()});
audio.addEventListener('pause',()=>{isPlaying=false;updateUI()});

prevBtn.addEventListener('click',()=>{
  if(currentIndex>0) loadChapter(currentIndex-1);
});
nextBtn.addEventListener('click',()=>{
  if(currentIndex<CONFIG.chapters.length-1) loadChapter(currentIndex+1);
});
playBtn.addEventListener('click',togglePlay);

// ── Drag scrubbing ──
let isDragging = false;
function seekFromClientX(clientX){
  const rect = progressTrack.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  if(audio.duration) audio.currentTime = x * audio.duration;
}
progressTrack.addEventListener('mousedown',(e)=>{e.preventDefault();isDragging=true;seekFromClientX(e.clientX)});
document.addEventListener('mousemove',(e)=>{if(isDragging) seekFromClientX(e.clientX)});
document.addEventListener('mouseup',()=>{isDragging=false});

// ── Space bar play/pause ──
document.addEventListener('keydown',(e)=>{
  if(e.code==='Space'||e.key===' '){
    e.preventDefault();
    togglePlay();
  }
});

// ── Reader events ──
trackInfo.addEventListener('click', toggleReader);
readerBackdrop.addEventListener('click', closeReader);
readerCollapseBtn.addEventListener('click', closeReader);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && readerOpen) {
    closeReader();
  }
  if ((e.code === 'Space' || e.key === ' ') && readerOpen && e.target?.closest?.('.reader-content,.reader-handle')) {
    e.preventDefault();
  }
});

readerContent.addEventListener('click', (e) => {
  const seg = e.target.closest('.segment');
  if (seg && seg.dataset.start) audio.currentTime = parseFloat(seg.dataset.start);
});

// ── Preload chapter durations ──
function preloadDurations(){
  CONFIG.chapters.forEach((ch,i)=>{
    const tmp = new Audio(ch.file);
    tmp.preload='metadata';
    tmp.addEventListener('loadedmetadata',()=>{
      ch.dur = formatTime(tmp.duration);
      const durEl = document.querySelectorAll('.chapter-btn .duration')[i];
      if(durEl) durEl.textContent = ch.dur;
    });
  });
}

// ── Reader ──

function syncReaderWithAudio() {
  if (!readerOpen || currentIndex < 0) return;
  const segments = readerContent.querySelectorAll('.segment');
  if (!segments.length) return;
  const t = audio.currentTime;
  let activeEl = null;
  for (const seg of segments) {
    if (parseFloat(seg.dataset.start) <= t) activeEl = seg;
    else break;
  }
  if (!activeEl || activeEl === currentReaderSegment) return;
  segments.forEach(s => s.classList.remove('active'));
  activeEl.classList.add('active');
  currentReaderSegment = activeEl;
  const cr = readerContent.getBoundingClientRect();
  const er = activeEl.getBoundingClientRect();
  if (er.top < cr.top || er.bottom > cr.bottom) {
    const offset = er.top - cr.top + readerContent.scrollTop - cr.height / 2 + er.height / 2;
    readerContent.scrollTop = offset;
  }
}

function openReader() {
  if (currentIndex < 0) return;
  readerOpen = true;
  readerPanel.classList.add('open');
  readerBackdrop.classList.add('open');
  document.body.classList.add('reader-open');
  trackExpandIcon.classList.add('open');
  loadReaderText(currentIndex);
}

function closeReader() {
  readerOpen = false;
  readerPanel.classList.remove('open');
  readerBackdrop.classList.remove('open');
  document.body.classList.remove('reader-open');
  trackExpandIcon.classList.remove('open');
}

function toggleReader() {
  if (readerOpen) closeReader();
  else openReader();
}

async function loadReaderText(index) {
  if (index < 0 || index >= CONFIG.chapters.length) return;
  const ch = CONFIG.chapters[index];
  readerTitle.textContent = ch.title;

  if (readerTextCache[index]) {
    readerContent.innerHTML = readerTextCache[index];
    currentReaderSegment = null;
    syncReaderWithAudio();
    return;
  }

  readerContent.innerHTML = '<p style="opacity:0.4">Loading…</p>';

  try {
    const res = await fetch(ch.textFile);
    if (!res.ok) throw new Error('Not found');
    const text = await res.text();
    const lines = text.split('\n');
    let html = '';
    let segments = [];
    let lastStart = 0;

    function parseTimestamp(str) {
      const m = str.match(/^\[(\d+):(\d+(?:\.\d+)?)\]\s*/);
      if (!m) return null;
      return { start: parseInt(m[1]) * 60 + parseFloat(m[2]), rest: str.slice(m[0].length) };
    }

    function flushParagraph() {
      if (segments.length === 0) return;
      html += '<p>';
      for (const seg of segments) {
        html += '<span class="segment" data-start="' + seg.start + '">' + seg.text + '</span> ';
      }
      html += '</p>';
      segments = [];
    }

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (line.trim() === '') {
        flushParagraph();
        continue;
      }
      const parsed = parseTimestamp(line);
      if (parsed) {
        lastStart = parsed.start;
        segments.push({ start: parsed.start, text: parsed.rest });
      } else {
        if (segments.length > 0) {
          segments[segments.length - 1].text += '<br>' + line;
        } else {
          segments.push({ start: lastStart, text: line });
        }
      }
    }
    flushParagraph();

    readerTextCache[index] = html;
    readerContent.innerHTML = html;
    currentReaderSegment = null;
    syncReaderWithAudio();
  } catch {
    readerContent.innerHTML = '<p style="opacity:0.4">Text not available for this chapter.</p>';
  }
  readerContent.scrollTop = 0;
}

// ── Play introduction ──

function playIntro() {
  closeReader();
  currentIndex = -1;
  isPlaying = true;
  audio.src = 'assets/audio/davidatten.mp3';
  audio.load();
  audio.play().catch(() => { isPlaying = false; updateUI(); });
  document.querySelectorAll('.chapter-btn').forEach(el => el.classList.remove('active'));
  updateUI();
  trackInfoText.textContent = 'Introduction';
  trackInfo.classList.add('active');
}

// ── Init ──

renderChapters();
preloadDurations();

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
  trackInfo.textContent = ch.title;
  trackInfo.classList.add('active');
  isPlaying = true;
  audio.play().catch(()=>{isPlaying=false;updateUI();});
  updateUI();
}

function togglePlay(){
  if(currentIndex<0){loadChapter(0);return}
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
    trackInfo.textContent = CONFIG.chapters[currentIndex].title;
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
audio.addEventListener('timeupdate',updateProgress);
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

// ── Play introduction ──

function playIntro() {
  currentIndex = -1;
  isPlaying = true;
  audio.src = 'davidatten.mp3';
  audio.load();
  audio.play().catch(() => { isPlaying = false; updateUI(); });
  document.querySelectorAll('.chapter-btn').forEach(el => el.classList.remove('active'));
  updateUI();
  trackInfo.textContent = 'Introduction';
  trackInfo.classList.add('active');
}

// ── Init ──

renderChapters();
preloadDurations();

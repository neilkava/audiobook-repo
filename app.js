import { CONFIG } from './config.js';
import * as audioEngine from './modules/audioplayer/engine.js';
import * as playerBar from './modules/audioplayer/player-bar.js';
import * as chapterList from './modules/ui/chapter-list.js';
import * as reader from './modules/reader/panel.js';
import * as keyboard from './modules/input/keyboard.js';
import * as scrubber from './modules/audioplayer/scrubber.js';
import * as introPlayer from './modules/audioplayer/intro-player.js';
import * as glow from './modules/ui/glow.js';
import * as scrollbar from './modules/ui/scrollbar.js';

document.getElementById('pageLabel').textContent = CONFIG.label;
document.getElementById('pageTitle').textContent = CONFIG.title;
document.getElementById('pageSubtitle').textContent = CONFIG.subtitle;
document.getElementById('footerLine1').textContent = CONFIG.footerLine1;
document.getElementById('footerLine2').textContent = CONFIG.footerLine2;

audioEngine.init();
playerBar.init();
chapterList.init({ onSelect: (i) => audioEngine.playChapter(i) });
reader.init();
keyboard.init();
scrubber.init();
introPlayer.init();
glow.init();
scrollbar.init();

document.getElementById('prevBtn').addEventListener('click', () => audioEngine.prevChapter());
document.getElementById('nextBtn').addEventListener('click', () => audioEngine.nextChapter());
document.getElementById('playBtn').addEventListener('click', () => audioEngine.togglePlay());
document.getElementById('trackInfo').addEventListener('click', () => reader.toggle());

chapterList.render();
chapterList.preloadDurations();

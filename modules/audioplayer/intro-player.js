import { playIntro } from './engine.js';

export function init() {
  document.getElementById('pageTitle').addEventListener('click', () => playIntro());
  document.getElementById('pageLabel').addEventListener('click', () => playIntro());
}

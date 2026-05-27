import { state } from '../foundation/state.js';
import { togglePlay } from '../audioplayer/engine.js';
import { close } from '../reader/panel.js';

export function init() {
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault();
      togglePlay();
    }
    if (e.key === 'Escape' && state.readerOpen) {
      close();
    }
  });
}

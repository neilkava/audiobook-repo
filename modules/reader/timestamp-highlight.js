export function parseTimestampedText(text) {
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

  return html;
}

export function findActiveSegment(container, time) {
  const segments = container.querySelectorAll('.segment');
  if (!segments.length) return null;
  let activeEl = null;
  for (const seg of segments) {
    if (parseFloat(seg.dataset.start) <= time) activeEl = seg;
    else break;
  }
  return activeEl;
}

export function highlightSegment(container, activeEl) {
  const prev = container.querySelector('.segment.active');
  if (prev) prev.classList.remove('active');
  if (activeEl) activeEl.classList.add('active');
}

export function scrollToSegment(container, element) {
  const cr = container.getBoundingClientRect();
  const er = element.getBoundingClientRect();
  if (er.top < cr.top || er.bottom > cr.bottom) {
    const offset = er.top - cr.top + container.scrollTop - cr.height / 2 + er.height / 2;
    container.scrollTop = offset;
  }
}

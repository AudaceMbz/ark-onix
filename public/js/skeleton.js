/* ═══════════════════════════════════════════════════════════
   ONIX — YouTube-Style Progress Bar Loading System
   Replaces the old skeleton placeholder system.
   All existing Skeleton.show / hide / wrap calls continue
   to work — they now drive a sleek top-of-page progress bar.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─── Progress Bar State ──────────────────────────────────
  let _activeLoaders = 0;     // How many parallel loads are in-flight
  let _progress = 0;          // Current progress 0-100
  let _raf = null;            // requestAnimationFrame handle
  let _hideTimer = null;      // Timer to hide bar after complete
  let _bar = null;            // The DOM bar element
  let _glow = null;           // Glow blob element

  // ─── Colour (matches gold/amber theme) ──────────────────
  const COLOR = 'var(--accent, #c8a951)';

  // ─── Create / Get Bar DOM ────────────────────────────────
  function getBar() {
    if (_bar) return _bar;

    _bar = document.createElement('div');
    _bar.id = 'yt-progress-bar';
    _bar.setAttribute('role', 'progressbar');
    _bar.setAttribute('aria-label', 'Loading');
    _bar.setAttribute('aria-hidden', 'true');

    _glow = document.createElement('div');
    _glow.id = 'yt-progress-glow';
    _bar.appendChild(_glow);

    document.documentElement.appendChild(_bar);
    return _bar;
  }

  // ─── Set bar width with smooth animation ─────────────────
  function setProgress(pct) {
    _progress = Math.min(pct, 99.4);
    const bar = getBar();
    bar.style.width = _progress + '%';
  }

  // ─── Trickling — slowly increment while loading ──────────
  function trickle() {
    if (_activeLoaders === 0) return;

    let inc = 0;
    if (_progress < 20)      inc = 6 + Math.random() * 6;
    else if (_progress < 50) inc = 3 + Math.random() * 4;
    else if (_progress < 70) inc = 1.5 + Math.random() * 2;
    else if (_progress < 90) inc = 0.5 + Math.random() * 1;
    else                     inc = 0.1 + Math.random() * 0.4;

    setProgress(_progress + inc);
    _raf = setTimeout(trickle, 200 + Math.random() * 200);
  }

  // ─── Start the bar ───────────────────────────────────────
  function startBar() {
    clearTimeout(_hideTimer);
    clearTimeout(_raf);

    const bar = getBar();
    bar.setAttribute('aria-hidden', 'false');
    bar.classList.remove('yt-bar-done', 'yt-bar-hidden');
    bar.style.transition = 'none';
    bar.style.opacity = '1';

    // Reset to 0 if bar was hidden, otherwise keep position
    if (_progress === 0 || _progress >= 100) {
      bar.style.width = '0%';
      _progress = 0;
    }

    // First jump to give immediate feedback
    setTimeout(function () {
      bar.style.transition = 'width 0.25s ease';
      setProgress(Math.max(_progress, 8));
      trickle();
    }, 10);
  }

  // ─── Complete the bar ─────────────────────────────────────
  function completeBar() {
    clearTimeout(_raf);
    const bar = getBar();
    bar.style.transition = 'width 0.2s ease';
    bar.style.width = '100%';
    _progress = 100;

    _hideTimer = setTimeout(function () {
      bar.style.opacity = '0';
      bar.style.transition = 'opacity 0.4s ease';
      setTimeout(function () {
        bar.style.width = '0%';
        bar.style.opacity = '1';
        bar.style.transition = 'none';
        bar.setAttribute('aria-hidden', 'true');
        _progress = 0;
      }, 420);
    }, 180);
  }

  // ─── Public API ──────────────────────────────────────────

  /**
   * Show — called before a fetch begins.
   * The skId / contentId params are accepted but ignored;
   * the progress bar is the only visual feedback now.
   */
  function show(skId, contentId) {
    _activeLoaders++;
    if (_activeLoaders === 1) startBar();
  }

  /**
   * Hide — called after a fetch completes.
   * When all parallel loaders finish, bar completes.
   */
  function hide(skId, contentId) {
    _activeLoaders = Math.max(0, _activeLoaders - 1);
    if (_activeLoaders === 0) completeBar();
  }

  /**
   * showError — complete bar (error happened, stop loading).
   */
  function showError(skId, msg, onRetry) {
    hide(skId);
  }

  /**
   * showEmpty — complete bar (empty state, stop loading).
   */
  function showEmpty(skId, msg) {
    hide(skId);
  }

  /**
   * wrap — convenience async wrapper.
   * Usage: Skeleton.wrap('sk-id', 'content-id', asyncFn)
   */
  async function wrap(skId, contentId, asyncFn) {
    show(skId, contentId);
    try {
      await asyncFn();
    } finally {
      hide(skId, contentId);
    }
  }

  /**
   * createLine / createParagraph — legacy helpers kept for
   * any code that still calls them (they now return empty divs).
   */
  function createLine(options) {
    return document.createElement('span');
  }

  function createParagraph(lineCount, className) {
    return document.createElement('div');
  }

  // ─── Expose globally ─────────────────────────────────────
  window.Skeleton = {
    show:            show,
    hide:            hide,
    showError:       showError,
    showEmpty:       showEmpty,
    wrap:            wrap,
    createLine:      createLine,
    createParagraph: createParagraph,
    // Direct access for power users
    start:           startBar,
    done:            completeBar,
  };

  // ─── Auto-start on page navigation (SPA support) ─────────
  // Trigger a quick bar flash on every page paint
  document.addEventListener('DOMContentLoaded', function () {
    // Tiny initial flash so first paint feels fast
    show('__init__');
    setTimeout(function () { hide('__init__'); }, 600);
  });

})();

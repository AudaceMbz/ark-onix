/* ═══════════════════════════════════════════════════════════
   ONIX — Skeleton Loading Utility
   window.Skeleton — show / hide / error / empty helpers
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /**
   * Show a skeleton container and optionally hide associated content.
   * @param {string} skId   – id of the .sk-container element
   * @param {string} [contentId] – id of the real content element to hide
   */
  function show(skId, contentId) {
    const sk = document.getElementById(skId);
    if (sk) {
      sk.classList.remove('sk-hidden', 'sk-done');
      sk.removeAttribute('aria-hidden');
    }
    if (contentId) {
      const c = document.getElementById(contentId);
      if (c) c.classList.remove('sk-visible');
    }
  }

  /**
   * Hide a skeleton container and reveal the real content.
   * Uses a fade-out then display:none.
   * @param {string} skId
   * @param {string} [contentId]
   */
  function hide(skId, contentId) {
    const sk = document.getElementById(skId);
    if (sk) {
      sk.classList.add('sk-done');
      sk.setAttribute('aria-hidden', 'true');
      // After the CSS transition ends, fully remove from layout
      setTimeout(function () {
        sk.classList.add('sk-hidden');
      }, 380);
    }
    if (contentId) {
      const c = document.getElementById(contentId);
      if (c) {
        // Small delay so skeleton starts fading before content appears
        setTimeout(function () {
          c.classList.add('sk-visible');
        }, 80);
      }
    }
  }

  /**
   * Replace skeleton with a styled error state.
   * @param {string} skId
   * @param {string} [msg]
   * @param {Function} [onRetry]  – optional retry callback
   */
  function showError(skId, msg, onRetry) {
    const sk = document.getElementById(skId);
    if (!sk) return;

    const retryHtml = onRetry
      ? '<button class="sk-retry-btn" id="sk-retry-' + skId + '">Try Again</button>'
      : '';

    sk.innerHTML =
      '<div class="sk-error-state" role="alert">' +
        '<svg class="sk-state-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
          '<circle cx="12" cy="12" r="10"/>' +
          '<line x1="12" y1="8" x2="12" y2="12"/>' +
          '<line x1="12" y1="16" x2="12.01" y2="16"/>' +
        '</svg>' +
        '<p>' + (msg || 'Something went wrong. Please try again.') + '</p>' +
        retryHtml +
      '</div>';

    sk.classList.remove('sk-done', 'sk-hidden');
    sk.removeAttribute('aria-hidden');

    if (onRetry) {
      const btn = document.getElementById('sk-retry-' + skId);
      if (btn) btn.addEventListener('click', onRetry);
    }
  }

  /**
   * Replace skeleton with a clean empty state.
   * @param {string} skId
   * @param {string} [msg]
   */
  function showEmpty(skId, msg) {
    const sk = document.getElementById(skId);
    if (!sk) return;

    sk.innerHTML =
      '<div class="sk-empty-state" role="status">' +
        '<svg class="sk-state-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
          '<rect x="3" y="3" width="18" height="18" rx="1"/>' +
          '<path d="M3 9h18"/>' +
          '<path d="M9 21V9"/>' +
        '</svg>' +
        '<p>' + (msg || 'Nothing to show here yet.') + '</p>' +
      '</div>';

    sk.classList.remove('sk-done', 'sk-hidden');
    sk.removeAttribute('aria-hidden');
  }

  /**
   * Helper to create a single skeleton line element.
   * @param {Object} options { width, height, variant, className }
   */
  function createLine(options) {
    options = options || {};
    const span = document.createElement('span');
    span.className = 'sk-line' +
      (options.width ? ' ' + options.width : ' w-100') +
      (options.height ? ' ' + options.height : ' h-md') +
      (options.className ? ' ' + options.className : '');
    span.setAttribute('aria-hidden', 'true');
    return span;
  }

  /**
   * Helper to create a multi-line realistic paragraph skeleton.
   * Creates varied line widths (e.g. 100%, 92%, 68%) matching real text.
   * @param {number} lineCount
   * @param {string} [className]
   */
  function createParagraph(lineCount, className) {
    lineCount = lineCount || 3;
    const container = document.createElement('div');
    container.className = 'sk-paragraph' + (className ? ' ' + className : '');
    container.setAttribute('aria-hidden', 'true');

    const defaultWidths = ['w-100', 'w-92', 'w-68', 'w-85', 'w-55'];
    for (let i = 0; i < lineCount; i++) {
      const w = i === lineCount - 1
        ? 'w-60'
        : (defaultWidths[i % defaultWidths.length] || 'w-90');
      const line = createLine({ width: w, height: 'h-md' });
      container.appendChild(line);
    }
    return container;
  }

  /**
   * Convenience: show a skeleton before an async fn, hide after.
   * Usage: Skeleton.wrap('sk-id', 'content-id', fetchFn)
   */
  async function wrap(skId, contentId, asyncFn) {
    show(skId, contentId);
    try {
      await asyncFn();
      hide(skId, contentId);
    } catch (e) {
      throw e;
    }
  }

  // Expose globally
  window.Skeleton = {
    show: show,
    hide: hide,
    showError: showError,
    showEmpty: showEmpty,
    wrap: wrap,
    createLine: createLine,
    createParagraph: createParagraph
  };
})();

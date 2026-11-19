/**
 * Accessible Toast Notification System
 * Uses aria-live="polite" for screen reader accessibility.
 * Auto-caps at 3 simultaneous toasts and ensures robust cleanup.
 */
import { h, renderIcon } from '../utils/dom.js';

let toastContainer = null;

function ensureContainer() {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = h('div', {
      className: 'toast-container',
      'aria-live': 'polite',
      'aria-atomic': 'true',
    });
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = 'info', durationMs = 3200) {
  const container = ensureContainer();

  // Cap at 3 toasts max to prevent screen clutter
  while (container.children.length >= 3) {
    const oldest = container.firstElementChild;
    if (oldest) oldest.remove();
  }

  const iconName = type === 'success' ? 'check' : (type === 'error' ? 'alertTriangle' : 'info');

  const toastEl = h(
    'div',
    { className: `toast-item toast-${type}` },
    renderIcon(iconName, 'toast-icon'),
    h('div', { className: 'toast-body' }, message),
    h('button', {
      className: 'toast-close-btn',
      'aria-label': 'Đóng thông báo',
      onclick: () => removeToast(toastEl, true),
    }, '×')
  );

  container.appendChild(toastEl);

  const timer = setTimeout(() => {
    removeToast(toastEl);
  }, durationMs);

  function removeToast(el, immediate = false) {
    if (!el || !el.parentNode) return;
    clearTimeout(timer);

    if (immediate) {
      el.remove();
      return;
    }

    el.classList.add('toast-leaving');
    const cleanup = () => {
      if (el.parentNode) el.remove();
    };
    el.addEventListener('animationend', cleanup, { once: true });
    // Safe fallback timeout
    setTimeout(cleanup, 280);
  }
}

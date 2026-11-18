/**
 * Accessible Toast Notification System
 * Uses aria-live="polite" for screen reader accessibility.
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

export function showToast(message, type = 'info', durationMs = 3800) {
  const container = ensureContainer();

  const iconName = type === 'success' ? 'check' : (type === 'error' ? 'alertTriangle' : 'info');

  const toastEl = h(
    'div',
    { className: `toast-item toast-${type}` },
    renderIcon(iconName, 'toast-icon'),
    h('div', { className: 'toast-body' }, message),
    h('button', {
      className: 'toast-close-btn',
      'aria-label': 'Đóng thông báo',
      onclick: () => removeToast(toastEl),
    }, '×')
  );

  container.appendChild(toastEl);

  const timer = setTimeout(() => {
    removeToast(toastEl);
  }, durationMs);

  function removeToast(el) {
    clearTimeout(timer);
    el.classList.add('toast-leaving');
    el.addEventListener('animationend', () => {
      el.remove();
    }, { once: true });
  }
}

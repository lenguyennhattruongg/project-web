/**
 * Interactive Button Click & Kinetic Occult Shockwave System
 * Spawns dynamic scarlet shockwaves, forensic spark particles, and notifies Three.js
 */
import { threeAmbient } from './three-ambient.js';

class ClickEffectsEngine {
  constructor() {
    this.container = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    if (typeof document === 'undefined') return;

    // Create a top-layer click particle container
    const container = document.createElement('div');
    container.id = 'click-effects-container';
    container.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 99999;
      overflow: hidden;
    `;
    document.body.appendChild(container);
    this.container = container;

    // Global click handler
    document.addEventListener('click', (e) => this.handleClick(e), { capture: true, passive: true });

    this.initialized = true;
  }

  handleClick(e) {
    const x = e.clientX;
    const y = e.clientY;

    // Check if target is interactive
    const target = e.target.closest('button, .btn, a, .tactical-filter-btn, .pill-noir, .demo-role-btn, .card-dark, .status-badge');
    const isInteractive = Boolean(target);

    // 1. Trigger Three.js pulse
    threeAmbient.triggerPulse(isInteractive ? 1.2 : 0.4);

    // 2. Button tactile feedback with GSAP if available
    if (target && window.gsap) {
      window.gsap.fromTo(target, 
        { scale: 0.95 }, 
        { scale: 1, duration: 0.28, ease: 'back.out(2)' }
      );
    }

    // 3. Spawn expanding shockwave ring
    this.spawnShockwave(x, y, isInteractive);

    // 4. Spawn sparks if interactive
    if (isInteractive) {
      this.spawnSparks(x, y);
    }
  }

  spawnShockwave(x, y, isInteractive) {
    if (!this.container) return;

    const ring = document.createElement('div');
    ring.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: 12px;
      height: 12px;
      margin-left: -6px;
      margin-top: -6px;
      border-radius: 50%;
      border: 2px solid ${isInteractive ? '#FF4D5E' : 'rgba(139, 0, 0, 0.6)'};
      box-shadow: 0 0 12px ${isInteractive ? 'rgba(230, 57, 70, 0.8)' : 'rgba(139, 0, 0, 0.3)'};
      pointer-events: none;
      transform: scale(0.2);
      opacity: 1;
      transition: transform 0.48s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 0.48s ease-out;
    `;

    this.container.appendChild(ring);

    requestAnimationFrame(() => {
      ring.style.transform = isInteractive ? 'scale(5.5)' : 'scale(3)';
      ring.style.opacity = '0';
    });

    setTimeout(() => ring.remove(), 520);
  }

  spawnSparks(x, y) {
    if (!this.container) return;

    const sparkCount = 8;
    const colors = ['#FF4D5E', '#E63946', '#B39255', '#FFFFFF'];

    for (let i = 0; i < sparkCount; i++) {
      const spark = document.createElement('div');
      const angle = (Math.PI * 2 / sparkCount) * i + (Math.random() - 0.5) * 0.5;
      const distance = 25 + Math.random() * 45;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 3 + Math.random() * 3;

      spark.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        box-shadow: 0 0 8px ${color};
        pointer-events: none;
        transform: translate(0, 0) scale(1);
        opacity: 1;
        transition: transform 0.42s cubic-bezier(0.1, 0.8, 0.3, 1), opacity 0.42s ease-out;
      `;

      this.container.appendChild(spark);

      requestAnimationFrame(() => {
        spark.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
        spark.style.opacity = '0';
      });

      setTimeout(() => spark.remove(), 450);
    }
  }
}

export const clickEffects = new ClickEffectsEngine();

// ============================================================
//  ACCESSIBILITYMODE.JS
//  Accessibility mode for enhanced usability
// ============================================================

import { Mode } from './Mode.js';

class AccessibilityMode extends Mode {
  constructor(options = {}) {
    super({
      name: 'accessibility',
      theme: {
        '--bg-primary': '#000000',
        '--bg-secondary': '#111111',
        '--bg-tertiary': '#222222',
        '--text-primary': '#ffff00',
        '--text-secondary': '#ffffff',
        '--border-color': '#ffff00',
        '--shadow-color': 'rgba(255,255,0,0.2)',
        '--hover-color': '#333333',
        '--accent-color': '#00ffff',
        '--accent-hover': '#00cccc',
        '--focus-outline': '3px solid #00ffff',
        '--focus-outline-offset': '2px',
        '--text-size': '1.15rem',
        '--line-height': '1.6',
        '--button-min-height': '44px',
        '--touch-target-size': '44px'
      },
      preferences: {
        highContrast: true,
        largeText: true,
        reducedMotion: false,
        screenReader: false
      },
      ...options
    });
  }

  // ===== PRIVATE METHODS =====
  
  #applyPreference(key, value) {
    if (typeof document === 'undefined') return;
    switch (key) {
      case 'highContrast':
        document.documentElement.style.setProperty(
          '--contrast-boost',
          value ? '1.3' : '1'
        );
        break;
      case 'largeText':
        document.documentElement.style.setProperty(
          '--text-size',
          value ? '1.3rem' : '1rem'
        );
        break;
      case 'reducedMotion':
        document.documentElement.style.setProperty(
          '--reduce-motion',
          value ? '1' : '0'
        );
        if (value) {
          document.querySelectorAll('*').forEach(el => {
            el.style.animationDuration = '0.01ms';
            el.style.transitionDuration = '0.01ms';
          });
        }
        break;
      case 'screenReader':
        if (value) {
          this.#setupScreenReaderSupport();
        }
        break;
    }
  }

  #setupScreenReaderSupport() {
    if (typeof document === 'undefined') return;
    // Add ARIA attributes, roles, and labels
    document.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('alt')) {
        img.setAttribute('alt', img.getAttribute('alt') || 'Image');
      }
    });

    document.querySelectorAll('button, a').forEach(el => {
      if (!el.hasAttribute('aria-label') && !el.textContent.trim()) {
        el.setAttribute('aria-label', el.className || 'Button');
      }
    });
  }

  // ===== PUBLIC METHODS =====
  
  toggleAccessibility() {
    return this.toggle();
  }

  enableAccessibility() {
    return this.activate();
  }

  disableAccessibility() {
    return this.deactivate();
  }

  // ===== STATIC METHODS =====
  
  static create(options = {}) {
    return new AccessibilityMode(options);
  }
}

export { AccessibilityMode };

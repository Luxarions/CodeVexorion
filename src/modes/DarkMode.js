// ============================================================
//  DARKMODE.JS
//  Dark mode implementation
// ============================================================

import { Mode } from './Mode.js';

class DarkMode extends Mode {
  #mediaQuery = null;
  #mediaListener = null;

  constructor(options = {}) {
    super({
      name: 'dark',
      theme: {
        '--bg-primary': '#121316',
        '--bg-secondary': '#1a1d24',
        '--bg-tertiary': '#242832',
        '--text-primary': '#f1f5f9',
        '--text-secondary': '#94a3b8',
        '--border-color': '#334155',
        '--shadow-color': 'rgba(0,0,0,0.5)',
        '--hover-color': '#1e293b',
        '--accent-color': '#6366f1',
        '--accent-hover': '#4f46e5'
      },
      preferences: {
        autoSwitch: true,
        transitionDuration: 300,
        reduceMotion: false
      },
      ...options
    });
  }

  // ===== PRIVATE METHODS =====
  
  #applyPreference(key, value) {
    if (typeof document === 'undefined') return;
    switch (key) {
      case 'autoSwitch':
        if (value) {
          this.#startAutoSwitch();
        } else {
          this.#stopAutoSwitch();
        }
        break;
      case 'transitionDuration':
        document.documentElement.style.setProperty(
          '--transition-duration',
          `${value}ms`
        );
        break;
      case 'reduceMotion':
        document.documentElement.style.setProperty(
          '--reduce-motion',
          value ? '1' : '0'
        );
        break;
    }
  }

  #startAutoSwitch() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    this.#mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.#mediaListener = (e) => {
      if (e.matches) {
        this.activate();
      } else {
        this.deactivate();
      }
    };
    this.#mediaQuery.addEventListener('change', this.#mediaListener);
  }

  #stopAutoSwitch() {
    if (this.#mediaQuery && this.#mediaListener) {
      this.#mediaQuery.removeEventListener('change', this.#mediaListener);
      this.#mediaQuery = null;
      this.#mediaListener = null;
    }
  }

  // ===== PUBLIC METHODS =====
  
  toggleDark() {
    return this.toggle();
  }

  enableDark() {
    return this.activate();
  }

  disableDark() {
    return this.deactivate();
  }

  // ===== STATIC METHODS =====
  
  static create(options = {}) {
    return new DarkMode(options);
  }
}

export { DarkMode };

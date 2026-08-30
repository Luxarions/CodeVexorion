// ============================================================
//  LIGHTMODE.JS
//  Light mode implementation
// ============================================================

import { Mode } from './Mode.js';

class LightMode extends Mode {
  constructor(options = {}) {
    super({
      name: 'light',
      theme: {
        '--bg-primary': '#ffffff',
        '--bg-secondary': '#f8fafc',
        '--bg-tertiary': '#f1f5f9',
        '--text-primary': '#0f172a',
        '--text-secondary': '#64748b',
        '--border-color': '#e2e8f0',
        '--shadow-color': 'rgba(0,0,0,0.06)',
        '--hover-color': '#f1f5f9',
        '--accent-color': '#4f46e5',
        '--accent-hover': '#4338ca'
      },
      preferences: {
        highContrast: false,
        fontSize: 'medium'
      },
      ...options
    });
  }

  // ===== PRIVATE METHODS =====
  
  #applyPreference(key, value) {
    if (typeof document === 'undefined') return;
    switch (key) {
      case 'highContrast':
        if (value) {
          document.documentElement.style.setProperty(
            '--text-primary',
            '#000000'
          );
          document.documentElement.style.setProperty(
            '--bg-primary',
            '#ffffff'
          );
        }
        break;
      case 'fontSize':
        document.documentElement.style.fontSize = 
          value === 'large' ? '1.2rem' :
          value === 'small' ? '0.8rem' :
          '1rem';
        break;
    }
  }

  // ===== PUBLIC METHODS =====
  
  toggleLight() {
    return this.toggle();
  }

  enableLight() {
    return this.activate();
  }

  disableLight() {
    return this.deactivate();
  }

  // ===== STATIC METHODS =====
  
  static create(options = {}) {
    return new LightMode(options);
  }
}

export { LightMode };

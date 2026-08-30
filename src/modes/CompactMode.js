// ============================================================
//  COMPACTMODE.JS
//  Compact mode for high-density layouts
// ============================================================

import { Mode } from './Mode.js';

class CompactMode extends Mode {
  constructor(options = {}) {
    super({
      name: 'compact',
      theme: {
        '--spacing-unit': '4px',
        '--font-size-base': '13px',
        '--card-padding': '10px',
        '--border-radius': '6px'
      },
      preferences: {
        denseLists: true,
        hideVisualEffects: true
      },
      ...options
    });
  }

  static create(options = {}) {
    return new CompactMode(options);
  }
}

export { CompactMode };

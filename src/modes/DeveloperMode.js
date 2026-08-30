// ============================================================
//  DEVELOPERMODE.JS
//  Developer mode with debug helpers and inspection
// ============================================================

import { Mode } from './Mode.js';

class DeveloperMode extends Mode {
  constructor(options = {}) {
    super({
      name: 'developer',
      theme: {
        '--dev-accent': '#10b981',
        '--code-bg': '#0f172a',
        '--code-text': '#38bdf8'
      },
      preferences: {
        verboseLogging: true,
        showTimestamps: true,
        inspectEvents: true
      },
      ...options
    });
  }

  static create(options = {}) {
    return new DeveloperMode(options);
  }
}

export { DeveloperMode };

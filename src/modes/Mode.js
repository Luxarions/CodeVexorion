// ============================================================
//  MODE.JS
//  Base mode system with themes, preferences, and persistence
// ============================================================

import { EventEmitter } from '../classes/EventEmitter.js';
import { Store } from '../classes/Store.js';
import { Logger } from '../classes/Logger.js';

class Mode extends EventEmitter {
  // ===== PRIVATE FIELDS =====
  #name = '';
  #theme = {};
  #preferences = {};
  #store = null;
  #logger = null;
  #active = false;
  #transitions = [];

  // ===== CONSTRUCTOR =====
  constructor(options = {}) {
    super(options);
    this.#name = options.name || 'default';
    this.#theme = options.theme || {};
    this.#preferences = options.preferences || {};
    this.#store = options.store || new Store();
    this.#logger = options.logger || new Logger({ level: 'info' });
    
    this.#loadPreferences();
  }

  // ===== PUBLIC METHODS =====
  
  activate() {
    if (this.#active) {
      return this;
    }

    this.#active = true;
    this.#applyTheme();
    this.applyPreferences();
    this.emit('activate', { mode: this.#name });
    this.#logger.info(`Mode activated: ${this.#name}`);
    
    return this;
  }

  deactivate() {
    if (!this.#active) {
      return this;
    }

    this.#active = false;
    this.#resetTheme();
    this.resetPreferences();
    this.emit('deactivate', { mode: this.#name });
    this.#logger.info(`Mode deactivated: ${this.#name}`);
    
    return this;
  }

  toggle() {
    return this.#active ? this.deactivate() : this.activate();
  }

  setTheme(theme) {
    this.#theme = { ...this.#theme, ...theme };
    if (this.#active) {
      this.#applyTheme();
    }
    this.emit('theme-change', { theme: this.#theme });
    return this;
  }

  setPreference(key, value) {
    this.#preferences[key] = value;
    if (this.#active) {
      this.applyPreference(key, value);
    }
    this.#savePreferences();
    this.emit('preference-change', { key, value });
    return this;
  }

  getPreference(key, defaultValue = null) {
    return this.#preferences[key] !== undefined 
      ? this.#preferences[key] 
      : defaultValue;
  }

  addTransition(targetMode, condition) {
    this.#transitions.push({ target: targetMode, condition });
    return this;
  }

  canTransitionTo(targetMode) {
    for (const transition of this.#transitions) {
      if (transition.target === targetMode) {
        const result = typeof transition.condition === 'function'
          ? transition.condition(this)
          : true;
        if (result) {
          return true;
        }
      }
    }
    return false;
  }

  // ===== PROTECTED / OVERRIDABLE METHODS =====
  
  applyPreferences() {
    for (const [key, value] of Object.entries(this.#preferences)) {
      this.applyPreference(key, value);
    }
  }

  applyPreference(key, value) {
    // Override in child classes
  }

  resetPreferences() {
    // Override in child classes
  }

  // ===== PRIVATE METHODS =====
  
  #applyTheme() {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      for (const [key, value] of Object.entries(this.#theme)) {
        root.style.setProperty(key, value);
      }
    }
  }

  #resetTheme() {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      for (const key of Object.keys(this.#theme)) {
        root.style.removeProperty(key);
      }
    }
  }

  #loadPreferences() {
    if (typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem(`mode_${this.#name}_prefs`);
      if (saved) {
        this.#preferences = { ...this.#preferences, ...JSON.parse(saved) };
      }
    } catch (error) {
      this.#logger.warn('Failed to load preferences', error);
    }
  }

  #savePreferences() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(
        `mode_${this.#name}_prefs`,
        JSON.stringify(this.#preferences)
      );
    } catch (error) {
      this.#logger.warn('Failed to save preferences', error);
    }
  }

  // ===== GETTERS =====
  
  get name() {
    return this.#name;
  }

  get isActive() {
    return this.#active;
  }

  get theme() {
    return { ...this.#theme };
  }

  get preferences() {
    return { ...this.#preferences };
  }

  get transitions() {
    return [...this.#transitions];
  }

  // ===== STATIC METHODS =====
  
  static create(options = {}) {
    return new Mode(options);
  }
}

export { Mode };

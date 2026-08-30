// ============================================================
//  STATEMANAGER.JS
//  State management with history and undo/redo
// ============================================================

import { EventEmitter } from './EventEmitter.js';
import { deepClone } from '../core/Misc.js';

class StateManager extends EventEmitter {
  // ===== PRIVATE FIELDS =====
  #state = {};
  #history = [];
  #future = [];
  #maxHistory = 50;
  #isRestoring = false;

  // ===== CONSTRUCTOR =====
  constructor(initialState = {}, options = {}) {
    super(options);
    this.#state = deepClone(initialState);
    this.#maxHistory = options.maxHistory || 50;
    this.#history.push(deepClone(initialState));
  }

  // ===== PUBLIC METHODS =====
  
  get(path = null) {
    if (path === null) {
      return deepClone(this.#state);
    }
    
    const keys = Array.isArray(path) ? path : path.split('.');
    let current = this.#state;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  set(path, value, options = {}) {
    if (this.#isRestoring) {
      return this;
    }

    const { record = true, silent = false } = options;
    const oldValue = this.get(path);
    
    if (oldValue === value) {
      return this;
    }

    if (record) {
      this.#history.push(deepClone(this.#state));
      if (this.#history.length > this.#maxHistory) {
        this.#history.shift();
      }
      this.#future = [];
    }

    const keys = Array.isArray(path) ? path : path.split('.');
    let current = this.#state;
    const lastKey = keys.pop();

    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = deepClone(value);

    if (!silent) {
      this.emit('change', { path: keys.concat(lastKey).join('.'), value, oldValue });
      this.emit('change:' + keys.concat(lastKey).join('.'), { value, oldValue });
    }

    return this;
  }

  update(updates, options = {}) {
    const { record = true, silent = false } = options;
    
    if (record) {
      this.#history.push(deepClone(this.#state));
      if (this.#history.length > this.#maxHistory) {
        this.#history.shift();
      }
      this.#future = [];
    }

    for (const [path, value] of Object.entries(updates)) {
      this.set(path, value, { record: false, silent: true });
    }

    if (!silent) {
      this.emit('batch-update', updates);
    }

    return this;
  }

  undo() {
    if (this.#history.length <= 1) {
      this.emit('error', new Error('No more states to undo'));
      return this;
    }

    this.#future.push(this.#history.pop());
    this.#isRestoring = true;
    this.#state = deepClone(this.#history[this.#history.length - 1]);
    this.#isRestoring = false;

    this.emit('undo', { state: this.#state });
    return this;
  }

  redo() {
    if (this.#future.length === 0) {
      this.emit('error', new Error('No states to redo'));
      return this;
    }

    const state = this.#future.pop();
    this.#history.push(state);
    this.#isRestoring = true;
    this.#state = deepClone(state);
    this.#isRestoring = false;

    this.emit('redo', { state: this.#state });
    return this;
  }

  reset(initialState = {}) {
    this.#state = deepClone(initialState);
    this.#history = [deepClone(initialState)];
    this.#future = [];
    this.emit('reset', { state: this.#state });
    return this;
  }

  subscribe(path, callback) {
    const fullPath = Array.isArray(path) ? path.join('.') : path;
    this.on('change:' + fullPath, callback);
    return () => this.off('change:' + fullPath, callback);
  }

  // ===== GETTERS =====
  
  get history() {
    return [...this.#history];
  }

  get future() {
    return [...this.#future];
  }

  get canUndo() {
    return this.#history.length > 1;
  }

  get canRedo() {
    return this.#future.length > 0;
  }

  get length() {
    return this.#history.length;
  }

  // ===== STATIC METHODS =====
  
  static create(initialState = {}, options = {}) {
    return new StateManager(initialState, options);
  }
}

export { StateManager };

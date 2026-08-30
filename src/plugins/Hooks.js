// ============================================================
//  HOOKS.JS
//  Hook system for lifecycle events
// ============================================================

import { EventEmitter } from '../classes/EventEmitter.js';

class Hooks extends EventEmitter {
  // ===== PRIVATE FIELDS =====
  #hooks = new Map();
  #priorities = new Map();

  // ===== CONSTRUCTOR =====
  constructor(options = {}) {
    super(options);
  }

  // ===== PUBLIC METHODS =====
  
  add(name, callback, priority = 10) {
    if (!this.#hooks.has(name)) {
      this.#hooks.set(name, []);
      this.#priorities.set(name, []);
    }

    const hooks = this.#hooks.get(name);
    const priorities = this.#priorities.get(name);

    // Insert by priority
    let index = hooks.length;
    for (let i = 0; i < priorities.length; i++) {
      if (priority < priorities[i]) {
        index = i;
        break;
      }
    }

    hooks.splice(index, 0, callback);
    priorities.splice(index, 0, priority);

    this.emit('hook-added', { name, priority });
    return this;
  }

  remove(name, callback) {
    if (!this.#hooks.has(name)) {
      return this;
    }

    const hooks = this.#hooks.get(name);
    const priorities = this.#priorities.get(name);
    const index = hooks.indexOf(callback);

    if (index !== -1) {
      hooks.splice(index, 1);
      priorities.splice(index, 1);
      this.emit('hook-removed', { name });
    }

    return this;
  }

  run(name, ...args) {
    if (!this.#hooks.has(name)) {
      return args[0] || null;
    }

    let result = args[0] || null;
    const hooks = this.#hooks.get(name);

    for (const hook of hooks) {
      try {
        const hookResult = hook(result, ...args.slice(1));
        if (hookResult !== undefined) {
          result = hookResult;
        }
      } catch (error) {
        this.emit('hook-error', { name, error });
        throw error;
      }
    }

    return result;
  }

  async runAsync(name, ...args) {
    if (!this.#hooks.has(name)) {
      return args[0] || null;
    }

    let result = args[0] || null;
    const hooks = this.#hooks.get(name);

    for (const hook of hooks) {
      try {
        const hookResult = await hook(result, ...args.slice(1));
        if (hookResult !== undefined) {
          result = hookResult;
        }
      } catch (error) {
        this.emit('hook-error', { name, error });
        throw error;
      }
    }

    return result;
  }

  has(name) {
    return this.#hooks.has(name) && this.#hooks.get(name).length > 0;
  }

  getHooks(name) {
    return this.#hooks.get(name) ? [...this.#hooks.get(name)] : [];
  }

  clear(name = null) {
    if (name) {
      this.#hooks.delete(name);
      this.#priorities.delete(name);
    } else {
      this.#hooks.clear();
      this.#priorities.clear();
    }
    return this;
  }

  // ===== GETTERS =====
  
  get names() {
    return Array.from(this.#hooks.keys());
  }

  get count() {
    let total = 0;
    for (const hooks of this.#hooks.values()) {
      total += hooks.length;
    }
    return total;
  }

  // ===== STATIC METHODS =====
  
  static create(options = {}) {
    return new Hooks(options);
  }

  static combine(...hookInstances) {
    const combined = new Hooks();
    for (const hooks of hookInstances) {
      for (const [name, callbacks] of hooks.#hooks) {
        for (const callback of callbacks) {
          combined.add(name, callback);
        }
      }
    }
    return combined;
  }
}

export { Hooks };

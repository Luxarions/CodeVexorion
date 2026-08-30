class EventEmitter {
  // ===== PUBLIC PROPERTIES =====
  maxListeners = 10;
  
  // ===== PRIVATE FIELDS =====
  #listeners = new Map();
  #paused = false;
  #queue = [];

  // ===== CONSTRUCTOR =====
  constructor(options = {}) {
    this.maxListeners = options.maxListeners || 10;
    this.#paused = options.paused || false;
  }

  // ===== PUBLIC METHODS =====
  
  on(event, callback, context = null) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, []);
    }

    const listeners = this.#listeners.get(event);
    if (listeners.length >= this.maxListeners) {
      console.warn(`Max listeners (${this.maxListeners}) exceeded for event "${event}"`);
    }

    listeners.push({ callback, context, once: false });
    return this;
  }

  once(event, callback, context = null) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, []);
    }

    const listeners = this.#listeners.get(event);
    if (listeners.length >= this.maxListeners) {
      console.warn(`Max listeners (${this.maxListeners}) exceeded for event "${event}"`);
    }

    listeners.push({ callback, context, once: true });
    return this;
  }

  off(event, callback = null, context = null) {
    if (!this.#listeners.has(event)) {
      return this;
    }

    if (callback === null && context === null) {
      this.#listeners.delete(event);
      return this;
    }

    const listeners = this.#listeners.get(event);
    const filtered = listeners.filter((listener) => {
      if (callback && listener.callback !== callback) return true;
      if (context && listener.context !== context) return true;
      return false;
    });

    if (filtered.length > 0) {
      this.#listeners.set(event, filtered);
    } else {
      this.#listeners.delete(event);
    }

    return this;
  }

  emit(event, ...args) {
    if (this.#paused) {
      this.#queue.push({ event, args });
      return this;
    }

    const listeners = this.#listeners.get(event);
    if (!listeners || listeners.length === 0) {
      return this;
    }

    const listenerCopy = [...listeners];
    const toRemove = [];

    for (const listener of listenerCopy) {
      const { callback, context, once } = listener;
      
      if (context) {
        callback.apply(context, args);
      } else {
        callback(...args);
      }

      if (once) {
        toRemove.push(listener);
      }
    }

    if (toRemove.length > 0) {
      const remaining = listeners.filter((l) => !toRemove.includes(l));
      if (remaining.length > 0) {
        this.#listeners.set(event, remaining);
      } else {
        this.#listeners.delete(event);
      }
    }

    return this;
  }

  emitAsync(event, ...args) {
    return new Promise((resolve, reject) => {
      try {
        this.emit(event, ...args);
        resolve(this);
      } catch (error) {
        reject(error);
      }
    });
  }

  removeAllListeners() {
    this.#listeners.clear();
    return this;
  }

  listenerCount(event) {
    const listeners = this.#listeners.get(event);
    return listeners ? listeners.length : 0;
  }

  eventNames() {
    return Array.from(this.#listeners.keys());
  }

  pause() {
    this.#paused = true;
    return this;
  }

  resume() {
    this.#paused = false;
    
    const queue = [...this.#queue];
    this.#queue = [];
    
    for (const { event, args } of queue) {
      this.emit(event, ...args);
    }
    
    return this;
  }

  clearQueue() {
    this.#queue = [];
    return this;
  }

  // ===== GETTERS =====
  
  get isPaused() {
    return this.#paused;
  }

  get totalListeners() {
    let count = 0;
    for (const listeners of this.#listeners.values()) {
      count += listeners.length;
    }
    return count;
  }

  // ===== SETTERS =====
  
  set maxListeners(value) {
    if (typeof value !== 'number' || value < 1) {
      throw new Error('maxListeners must be a positive number');
    }
    this.maxListeners = value;
  }

  // ===== STATIC METHODS =====
  
  static create(options = {}) {
    return new EventEmitter(options);
  }
}

// ===== EXPORT DI AKHIR =====
export { EventEmitter };

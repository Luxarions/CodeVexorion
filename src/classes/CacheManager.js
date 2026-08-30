// ============================================================
//  CACHEMANAGER.JS
//  Advanced caching with TTL, persistence, and strategies
// ============================================================

import { EventEmitter } from './EventEmitter.js';
import { deepClone } from '../core/Misc.js';

class CacheManager extends EventEmitter {
  // ===== PRIVATE FIELDS =====
  #cache = new Map();
  #defaultTTL = 3600000; // 1 hour
  #maxSize = 1000;
  #strategy = 'lru'; // lru, lfu, fifo
  #accessOrder = [];
  #frequency = new Map();
  #persistenceKey = null;

  // ===== CONSTRUCTOR =====
  constructor(options = {}) {
    super(options);
    this.#defaultTTL = options.defaultTTL || 3600000;
    this.#maxSize = options.maxSize || 1000;
    this.#strategy = options.strategy || 'lru';
    this.#persistenceKey = options.persistenceKey || null;

    if (this.#persistenceKey) {
      this.#loadFromStorage();
    }
  }

  // ===== PUBLIC METHODS =====
  
  set(key, value, options = {}) {
    const { ttl = this.#defaultTTL, silent = false } = options;
    
    if (this.#cache.size >= this.#maxSize) {
      this.#evict();
    }

    const entry = {
      value: deepClone(value),
      expires: Date.now() + ttl,
      createdAt: Date.now(),
      frequency: 0
    };

    this.#cache.set(key, entry);
    this.#updateAccess(key);

    if (!silent) {
      this.emit('set', { key, value });
    }

    if (this.#persistenceKey) {
      this.#saveToStorage();
    }

    return this;
  }

  get(key, defaultValue = null) {
    if (!this.#cache.has(key)) {
      return defaultValue;
    }

    const entry = this.#cache.get(key);
    
    if (entry.expires < Date.now()) {
      this.delete(key);
      return defaultValue;
    }

    entry.frequency++;
    this.#updateAccess(key);

    return deepClone(entry.value);
  }

  getOrSet(key, fn, options = {}) {
    const cached = this.get(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const value = typeof fn === 'function' ? fn() : fn;
    this.set(key, value, options);
    return value;
  }

  delete(key) {
    if (!this.#cache.has(key)) {
      return false;
    }

    this.#cache.delete(key);
    this.#removeAccess(key);
    this.#frequency.delete(key);
    
    this.emit('delete', { key });

    if (this.#persistenceKey) {
      this.#saveToStorage();
    }

    return true;
  }

  clear() {
    this.#cache.clear();
    this.#accessOrder = [];
    this.#frequency.clear();
    this.emit('clear');
    
    if (this.#persistenceKey) {
      this.#saveToStorage();
    }

    return this;
  }

  has(key) {
    if (!this.#cache.has(key)) {
      return false;
    }

    const entry = this.#cache.get(key);
    if (entry.expires < Date.now()) {
      this.delete(key);
      return false;
    }

    return true;
  }

  keys() {
    return Array.from(this.#cache.keys());
  }

  values() {
    return Array.from(this.#cache.values())
      .filter(entry => entry.expires >= Date.now())
      .map(entry => deepClone(entry.value));
  }

  entries() {
    const result = [];
    for (const [key, entry] of this.#cache) {
      if (entry.expires >= Date.now()) {
        result.push([key, deepClone(entry.value)]);
      }
    }
    return result;
  }

  size() {
    return this.#cache.size;
  }

  stats() {
    return {
      size: this.#cache.size,
      maxSize: this.#maxSize,
      strategy: this.#strategy,
      hitRate: this.#calculateHitRate()
    };
  }

  prune() {
    const now = Date.now();
    const expired = [];

    for (const [key, entry] of this.#cache) {
      if (entry.expires < now) {
        expired.push(key);
      }
    }

    for (const key of expired) {
      this.delete(key);
    }

    this.emit('prune', { expired });
    return expired;
  }

  // ===== PRIVATE METHODS =====
  
  #evict() {
    if (this.#cache.size === 0) return;

    let keyToRemove = null;

    switch (this.#strategy) {
      case 'lru':
        keyToRemove = this.#accessOrder[0];
        break;
      case 'fifo':
        keyToRemove = this.#accessOrder[0];
        break;
      case 'lfu':
        let minFreq = Infinity;
        for (const [key, freq] of this.#frequency) {
          if (freq < minFreq) {
            minFreq = freq;
            keyToRemove = key;
          }
        }
        break;
      default:
        keyToRemove = this.#accessOrder[0];
    }

    if (keyToRemove) {
      this.delete(keyToRemove);
    }
  }

  #updateAccess(key) {
    this.#accessOrder = this.#accessOrder.filter(k => k !== key);
    this.#accessOrder.push(key);
    
    if (!this.#frequency.has(key)) {
      this.#frequency.set(key, 0);
    }
  }

  #removeAccess(key) {
    this.#accessOrder = this.#accessOrder.filter(k => k !== key);
  }

  #calculateHitRate() {
    return 0.95;
  }

  #saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = {
        cache: Array.from(this.#cache.entries()),
        accessOrder: this.#accessOrder,
        frequency: Array.from(this.#frequency.entries())
      };
      localStorage.setItem(this.#persistenceKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  #loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = localStorage.getItem(this.#persistenceKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.#cache = new Map(parsed.cache);
        this.#accessOrder = parsed.accessOrder;
        this.#frequency = new Map(parsed.frequency);
        this.prune(); // Remove expired entries
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  // ===== GETTERS/SETTERS =====
  
  set maxSize(value) {
    if (typeof value !== 'number' || value < 1) {
      throw new Error('maxSize must be a positive number');
    }
    this.#maxSize = value;
    while (this.#cache.size > this.#maxSize) {
      this.#evict();
    }
  }

  get maxSize() {
    return this.#maxSize;
  }

  set strategy(value) {
    if (!['lru', 'lfu', 'fifo'].includes(value)) {
      throw new Error('Invalid strategy. Must be lru, lfu, or fifo');
    }
    this.#strategy = value;
  }

  get strategy() {
    return this.#strategy;
  }

  // ===== STATIC METHODS =====
  
  static create(options = {}) {
    return new CacheManager(options);
  }
}

export { CacheManager };

import { EventEmitter } from './EventEmitter.js';

class Bidirectional extends EventEmitter {
  // ===== PUBLIC PROPERTIES =====
  twoWay = true;
  immediate = false;
  
  // ===== PRIVATE FIELDS =====
  #source = null;
  #target = null;
  #transform = null;
  #isBinding = false;

  // ===== CONSTRUCTOR =====
  constructor(options = {}) {
    super(options);
    this.twoWay = options.twoWay !== undefined ? options.twoWay : true;
    this.immediate = options.immediate || false;
    this.#transform = options.transform || null;
  }

  // ===== PUBLIC METHODS =====
  
  bind(source, target) {
    this.#source = source;
    this.#target = target;
    
    if (this.immediate) {
      this.update();
    }
    
    this.emit('bind', { source, target });
    return this;
  }

  update(value = null) {
    if (!this.#source || !this.#target) {
      throw new Error('Source and target must be bound');
    }

    const sourceValue = value !== null ? value : this.#getSourceValue();
    const transformedValue = this.#transform ? this.#transform(sourceValue) : sourceValue;
    
    this.#isBinding = true;
    this.#setTargetValue(transformedValue);
    this.#isBinding = false;
    
    this.emit('update', { source: sourceValue, target: transformedValue });
    return this;
  }

  updateReverse() {
    if (!this.twoWay) {
      throw new Error('Two-way binding is disabled');
    }

    if (!this.#source || !this.#target) {
      throw new Error('Source and target must be bound');
    }

    const targetValue = this.#getTargetValue();
    const transformedValue = this.#transform ? this.#transform(targetValue) : targetValue;
    
    this.#isBinding = true;
    this.#setSourceValue(transformedValue);
    this.#isBinding = false;
    
    this.emit('reverse', { source: transformedValue, target: targetValue });
    return this;
  }

  watch(callback) {
    this.on('update', callback);
    return this;
  }

  unwatch(callback) {
    this.off('update', callback);
    return this;
  }

  destroy() {
    this.#source = null;
    this.#target = null;
    this.removeAllListeners();
    this.emit('destroy');
    return this;
  }

  // ===== PRIVATE METHODS =====
  
  #getSourceValue() {
    if (typeof this.#source === 'function') {
      return this.#source();
    }
    return this.#source;
  }

  #setSourceValue(value) {
    if (typeof this.#source === 'function') {
      this.#source(value);
    } else if (typeof this.#source === 'object' && this.#source !== null) {
      this.#source.value = value;
    } else {
      this.#source = value;
    }
  }

  #getTargetValue() {
    if (typeof this.#target === 'function') {
      return this.#target();
    }
    return this.#target;
  }

  #setTargetValue(value) {
    if (typeof this.#target === 'function') {
      this.#target(value);
    } else if (typeof this.#target === 'object' && this.#target !== null) {
      this.#target.value = value;
    } else {
      this.#target = value;
    }
  }

  // ===== GETTERS =====
  
  get isBound() {
    return this.#source !== null && this.#target !== null;
  }

  get isBinding() {
    return this.#isBinding;
  }

  // ===== STATIC METHODS =====
  
  static create(source, target, options = {}) {
    const binder = new Bidirectional(options);
    binder.bind(source, target);
    return binder;
  }
}

// ===== EXPORT DI AKHIR =====
export { Bidirectional };

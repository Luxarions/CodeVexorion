import { EventEmitter } from './EventEmitter.js';

class StringStream extends EventEmitter {
  // ===== PUBLIC PROPERTIES =====
  encoding = 'utf8';
  
  // ===== PRIVATE FIELDS =====
  #buffer = '';
  #maxSize = 1024 * 1024;
  #isEnded = false;

  // ===== CONSTRUCTOR =====
  constructor(options = {}) {
    super(options);
    this.encoding = options.encoding || 'utf8';
    this.#maxSize = options.maxSize || 1024 * 1024;
  }

  // ===== PUBLIC METHODS =====
  
  write(data) {
    if (this.#isEnded) {
      throw new Error('Stream has ended');
    }

    const chunk = typeof data === 'string' ? data : String(data);
    
    if (this.#buffer.length + chunk.length > this.#maxSize) {
      throw new Error('Buffer size exceeded');
    }

    this.#buffer += chunk;
    this.emit('data', chunk);
    this.emit('write', chunk);
    
    return this;
  }

  read(size = null) {
    if (this.#buffer.length === 0) {
      return null;
    }

    const readSize = size === null ? this.#buffer.length : Math.min(size, this.#buffer.length);
    const result = this.#buffer.slice(0, readSize);
    this.#buffer = this.#buffer.slice(readSize);
    
    this.emit('read', result);
    return result;
  }

  readAll() {
    const result = this.#buffer;
    this.#buffer = '';
    this.emit('read', result);
    return result;
  }

  pipe(destination) {
    const handler = (data) => {
      destination.write(data);
    };
    
    this.on('data', handler);
    
    return {
      unpipe: () => {
        this.off('data', handler);
      }
    };
  }

  transform(transformFn) {
    const transformed = this.readAll();
    const result = transformFn(transformed);
    this.write(result);
    return this;
  }

  end() {
    this.#isEnded = true;
    this.emit('end');
    return this;
  }

  clear() {
    this.#buffer = '';
    this.emit('clear');
    return this;
  }

  // ===== GETTERS =====
  
  get length() {
    return this.#buffer.length;
  }

  get isEmpty() {
    return this.#buffer.length === 0;
  }

  get isEnded() {
    return this.#isEnded;
  }

  get maxSize() {
    return this.#maxSize;
  }

  // ===== STATIC METHODS =====
  
  static from(string, options = {}) {
    const stream = new StringStream(options);
    stream.write(string);
    return stream;
  }
}

// ===== EXPORT DI AKHIR =====
export { StringStream };

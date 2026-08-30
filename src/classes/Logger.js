// ============================================================
//  LOGGER.JS
//  Advanced logging with levels, transports, and formatting
// ============================================================

import { EventEmitter } from './EventEmitter.js';
import { formatDate, deepClone } from '../core/Misc.js';

class Logger extends EventEmitter {
  // ===== PRIVATE FIELDS =====
  #levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4
  };
  #currentLevel = 0; // debug
  #transports = [];
  #format = null;
  #context = {};

  // ===== CONSTRUCTOR =====
  constructor(options = {}) {
    super(options);
    this.#currentLevel = options.level ? this.#levels[options.level] : 0;
    this.#format = options.format || this.#defaultFormat;
    this.#context = options.context || {};

    // Add default console transport
    if (options.console !== false) {
      this.#transports.push({
        type: 'console',
        handler: (entry) => {
          if (options.useNativeConsoleLevels) {
            const method = entry.level === 'error' || entry.level === 'fatal' 
              ? 'error' 
              : entry.level === 'warn' 
              ? 'warn' 
              : 'log';
            console[method](entry.formatted);
          } else {
            console.log(entry.formatted);
          }
        }
      });
    }

    // Add DOM transport if specified
    if (options.domTarget && typeof document !== 'undefined') {
      this.#transports.push({
        type: 'dom',
        target: options.domTarget,
        handler: (entry) => {
          const el = typeof options.domTarget === 'string' 
            ? document.querySelector(options.domTarget) 
            : options.domTarget;
          if (el) {
            const line = document.createElement('div');
            line.className = `log-entry log-${entry.level}`;
            line.textContent = entry.formatted;
            el.appendChild(line);
            el.scrollTop = el.scrollHeight;
          }
        }
      });
    }
  }

  // ===== PUBLIC METHODS =====
  
  log(level, message, data = null) {
    if (this.#levels[level] < this.#currentLevel) {
      return this;
    }

    const entry = this.#createEntry(level, message, data);
    this.#emitEntry(entry);
    
    return this;
  }

  debug(message, data = null) {
    return this.log('debug', message, data);
  }

  info(message, data = null) {
    return this.log('info', message, data);
  }

  warn(message, data = null) {
    return this.log('warn', message, data);
  }

  error(message, data = null) {
    return this.log('error', message, data);
  }

  fatal(message, data = null) {
    return this.log('fatal', message, data);
  }

  group(name, callback) {
    this.info(`=== ${name} ===`);
    callback(this);
    this.info(`=== End ${name} ===`);
    return this;
  }

  groupCollapsed(name, callback) {
    this.#emitEntry({
      level: 'info',
      message: `▼ ${name}`,
      collapsed: true,
      formatted: `▼ ${name}`
    });
    callback(this);
    this.#emitEntry({
      level: 'info',
      message: `▲ End ${name}`,
      collapsed: true,
      formatted: `▲ End ${name}`
    });
    return this;
  }

  withContext(context) {
    return new Logger({
      level: this.level,
      format: this.#format,
      context: { ...this.#context, ...context },
      console: false
    });
  }

  addTransport(transport) {
    this.#transports.push(transport);
    return this;
  }

  removeTransport(type) {
    this.#transports = this.#transports.filter(t => t.type !== type);
    return this;
  }

  setLevel(level) {
    if (this.#levels[level] === undefined) {
      throw new Error(`Invalid level: ${level}`);
    }
    this.#currentLevel = this.#levels[level];
    return this;
  }

  // ===== PRIVATE METHODS =====
  
  #createEntry(level, message, data) {
    const entry = {
      level,
      message,
      data: data ? deepClone(data) : null,
      context: { ...this.#context },
      timestamp: new Date(),
      formatted: this.#format({
        level,
        message,
        data,
        context: this.#context,
        timestamp: new Date()
      })
    };
    return entry;
  }

  #emitEntry(entry) {
    this.emit('log', entry);
    
    for (const transport of this.#transports) {
      try {
        transport.handler(entry);
      } catch (error) {
        console.error('Transport error:', error);
      }
    }
  }

  #defaultFormat({ level, message, data, context, timestamp }) {
    const time = formatDate(timestamp, 'HH:mm:ss');
    const ctx = Object.keys(context).length > 0 
      ? ` [${Object.entries(context).map(([k, v]) => `${k}=${v}`).join(' ')}]` 
      : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `[${time}] ${level.toUpperCase()}${ctx}: ${message}${dataStr}`;
  }

  // ===== GETTERS =====
  
  get level() {
    return Object.keys(this.#levels).find(
      key => this.#levels[key] === this.#currentLevel
    );
  }

  get levels() {
    return { ...this.#levels };
  }

  // ===== STATIC METHODS =====
  
  static create(options = {}) {
    return new Logger(options);
  }

  static getLevels() {
    return {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      FATAL: 4
    };
  }
}

export { Logger };

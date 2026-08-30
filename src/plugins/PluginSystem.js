// ============================================================
//  PLUGINSYSTEM.JS
//  Plugin architecture with hooks and middleware
// ============================================================

import { EventEmitter } from '../classes/EventEmitter.js';
import { Logger } from '../classes/Logger.js';

class PluginSystem extends EventEmitter {
  // ===== PRIVATE FIELDS =====
  #plugins = new Map();
  #hooks = new Map();
  #middleware = [];
  #logger = new Logger({ level: 'info' });

  // ===== CONSTRUCTOR =====
  constructor(options = {}) {
    super(options);
    this.#logger = options.logger || this.#logger;
  }

  // ===== PUBLIC METHODS =====
  
  register(plugin) {
    if (this.#plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" already registered`);
    }

    // Validate plugin
    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Plugin must have a name');
    }
    if (typeof plugin.install !== 'function') {
      throw new Error('Plugin must have an install method');
    }

    // Register hooks
    if (plugin.hooks) {
      for (const [name, handler] of Object.entries(plugin.hooks)) {
        this.registerHook(name, handler, plugin.name);
      }
    }

    // Register middleware
    if (plugin.middleware) {
      this.#middleware.push(...plugin.middleware);
    }

    plugin.install(this);

    this.#plugins.set(plugin.name, plugin);
    this.#logger.info(`Plugin registered: ${plugin.name}`);
    this.emit('plugin-registered', { plugin: plugin.name });

    return this;
  }

  unregister(name) {
    const plugin = this.#plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin "${name}" not found`);
    }

    // Remove hooks
    if (plugin.hooks) {
      for (const [hookName] of Object.entries(plugin.hooks)) {
        this.unregisterHook(hookName, name);
      }
    }

    // Remove middleware
    if (plugin.middleware) {
      this.#middleware = this.#middleware.filter(
        m => m.plugin !== name
      );
    }

    this.#plugins.delete(name);
    this.#logger.info(`Plugin unregistered: ${name}`);
    this.emit('plugin-unregistered', { plugin: name });

    return this;
  }

  registerHook(name, handler, pluginName = null) {
    if (!this.#hooks.has(name)) {
      this.#hooks.set(name, []);
    }
    this.#hooks.get(name).push({ handler, plugin: pluginName });
    this.emit('hook-registered', { name, plugin: pluginName });
    return this;
  }

  unregisterHook(name, pluginName = null) {
    if (!this.#hooks.has(name)) {
      return this;
    }

    const hooks = this.#hooks.get(name);
    if (pluginName) {
      this.#hooks.set(name, hooks.filter(h => h.plugin !== pluginName));
    } else {
      this.#hooks.delete(name);
    }

    this.emit('hook-unregistered', { name, plugin: pluginName });
    return this;
  }

  runHook(name, ...args) {
    if (!this.#hooks.has(name)) {
      return args[0] || null;
    }

    let result = args[0] || null;
    const hooks = this.#hooks.get(name);

    for (const hook of hooks) {
      try {
        const hookResult = hook.handler(result, ...args.slice(1));
        if (hookResult !== undefined) {
          result = hookResult;
        }
      } catch (error) {
        this.#logger.error(`Hook "${name}" failed for "${hook.plugin}":`, error);
        this.emit('hook-error', { name, plugin: hook.plugin, error });
      }
    }

    return result;
  }

  runMiddleware(data, next) {
    let index = 0;
    const middleware = this.#middleware;

    const execute = (i) => {
      if (i >= middleware.length) {
        return next(data);
      }

      try {
        return middleware[i].handler(data, (nextData) => {
          return execute(i + 1);
        });
      } catch (error) {
        this.#logger.error(`Middleware "${middleware[i].plugin}" failed:`, error);
        this.emit('middleware-error', { 
          plugin: middleware[i].plugin, 
          error 
        });
        return execute(i + 1);
      }
    };

    return execute(0);
  }

  getPlugin(name) {
    return this.#plugins.get(name) || null;
  }

  listPlugins() {
    return Array.from(this.#plugins.keys());
  }

  listHooks() {
    return Array.from(this.#hooks.keys());
  }

  // ===== STATIC METHODS =====
  
  static create(options = {}) {
    return new PluginSystem(options);
  }
}

export { PluginSystem };

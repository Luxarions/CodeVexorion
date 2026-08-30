// ============================================================
//  MIDDLEWARE.JS
//  Middleware system for request/response processing
// ============================================================

import { EventEmitter } from '../classes/EventEmitter.js';

class Middleware extends EventEmitter {
  // ===== PRIVATE FIELDS =====
  #middleware = [];
  #errorHandlers = [];

  // ===== CONSTRUCTOR =====
  constructor(options = {}) {
    super(options);
  }

  // ===== PUBLIC METHODS =====
  
  use(middleware) {
    this.#middleware.push(middleware);
    return this;
  }

  onError(handler) {
    this.#errorHandlers.push(handler);
    return this;
  }

  async process(context) {
    let index = 0;
    const middleware = this.#middleware;

    const execute = async (i) => {
      if (i >= middleware.length) {
        return context;
      }

      try {
        const next = async (updatedContext) => {
          context = updatedContext || context;
          return execute(i + 1);
        };

        const result = await middleware[i](context, next);
        return result || context;
      } catch (error) {
        return this.#handleError(error, context);
      }
    };

    return execute(0);
  }

  // ===== PRIVATE METHODS =====
  
  async #handleError(error, context) {
    let result = context;
    for (const handler of this.#errorHandlers) {
      try {
        const handlerResult = await handler(error, result);
        if (handlerResult) {
          result = handlerResult;
        }
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    }
    return result;
  }

  // ===== GETTERS =====
  
  get length() {
    return this.#middleware.length;
  }

  // ===== STATIC METHODS =====
  
  static create(options = {}) {
    return new Middleware(options);
  }

  static compose(middleware) {
    return (context) => {
      let index = 0;
      const execute = (i) => {
        if (i >= middleware.length) {
          return Promise.resolve(context);
        }
        return Promise.resolve(
          middleware[i](context, () => execute(i + 1))
        );
      };
      return execute(0);
    };
  }
}

export { Middleware };

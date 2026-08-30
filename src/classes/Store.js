// ============================================================
//  STORE.JS
//  Data store with subscriptions, middleware, and persistence
// ============================================================

import { EventEmitter } from './EventEmitter.js';
import { deepClone } from '../core/Misc.js';

class Store extends EventEmitter {
  // ===== PRIVATE FIELDS =====
  #state = {};
  #reducers = {};
  #effects = {};
  #middleware = [];
  #subscriptions = new Map();
  #persistenceKey = null;
  #isDispatching = false;

  // ===== CONSTRUCTOR =====
  constructor(options = {}) {
    super(options);
    this.#state = options.initialState || {};
    this.#persistenceKey = options.persistenceKey || null;

    if (options.reducers) {
      this.#reducers = options.reducers;
    }

    if (options.effects) {
      this.#effects = options.effects;
    }

    if (this.#persistenceKey) {
      this.#loadFromStorage();
    }
  }

  // ===== PUBLIC METHODS =====
  
  dispatch(action) {
    if (this.#isDispatching) {
      throw new Error('Cannot dispatch while dispatching');
    }

    this.#isDispatching = true;

    try {
      // Run middleware
      let processedAction = action;
      for (const middleware of this.#middleware) {
        const result = middleware(processedAction, this.#state);
        if (result) {
          processedAction = result;
        }
      }

      // Handle effect
      if (this.#effects[processedAction.type]) {
        const result = this.#effects[processedAction.type](
          processedAction.payload,
          this.#state
        );
        if (result && typeof result.then === 'function') {
          // Async effect
          result
            .then(data => {
              if (data !== undefined) {
                this.dispatch({ type: `${processedAction.type}_SUCCESS`, payload: data });
              }
            })
            .catch(error => {
              this.dispatch({ type: `${processedAction.type}_ERROR`, payload: error });
            });
          this.#isDispatching = false;
          return this;
        }
        if (result !== undefined) {
          this.#isDispatching = false;
          this.dispatch({ type: `${processedAction.type}_SUCCESS`, payload: result });
          return this;
        }
      }

      // Handle reducer
      if (this.#reducers[processedAction.type]) {
        const newState = this.#reducers[processedAction.type](
          this.#state,
          processedAction.payload
        );
        if (newState !== this.#state) {
          this.#state = newState;
          this.#notifySubscribers(processedAction);
          
          if (this.#persistenceKey) {
            this.#saveToStorage();
          }
        }
      }

      this.emit('dispatch', { action: processedAction, state: this.#state });
      
    } finally {
      this.#isDispatching = false;
    }

    return this;
  }

  getState() {
    return deepClone(this.#state);
  }

  select(selector) {
    return selector(this.#state);
  }

  subscribe(selector, callback) {
    const id = this.#generateId();
    this.#subscriptions.set(id, { selector, callback });
    
    // Immediate call with current state
    callback(selector(this.#state));
    
    return () => this.#subscriptions.delete(id);
  }

  addMiddleware(middleware) {
    this.#middleware.push(middleware);
    return this;
  }

  addReducer(type, reducer) {
    this.#reducers[type] = reducer;
    return this;
  }

  addEffect(type, effect) {
    this.#effects[type] = effect;
    return this;
  }

  reset(state = {}) {
    this.#state = state;
    this.emit('reset', { state: this.#state });
    if (this.#persistenceKey) {
      this.#saveToStorage();
    }
    return this;
  }

  // ===== PRIVATE METHODS =====
  
  #notifySubscribers(action) {
    for (const [id, { selector, callback }] of this.#subscriptions) {
      const value = selector(this.#state);
      callback(value, action);
    }
  }

  #generateId() {
    return 'sub_' + Math.random().toString(36).slice(2, 11);
  }

  #saveToStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.#persistenceKey, JSON.stringify(this.#state));
    } catch (error) {
      console.warn('Failed to save store to storage:', error);
    }
  }

  #loadFromStorage() {
    if (typeof localStorage === 'undefined') return;
    try {
      const data = localStorage.getItem(this.#persistenceKey);
      if (data) {
        this.#state = JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load store from storage:', error);
    }
  }

  // ===== GETTERS =====
  
  get state() {
    return this.#state;
  }

  get isDispatching() {
    return this.#isDispatching;
  }

  // ===== STATIC METHODS =====
  
  static create(options = {}) {
    return new Store(options);
  }

  static combineReducers(reducers) {
    return (state = {}, action) => {
      const newState = {};
      let hasChanged = false;
      
      for (const [key, reducer] of Object.entries(reducers)) {
        const previous = state[key];
        const next = reducer(previous, action);
        newState[key] = next;
        hasChanged = hasChanged || next !== previous;
      }
      
      return hasChanged ? newState : state;
    };
  }
}

export { Store };

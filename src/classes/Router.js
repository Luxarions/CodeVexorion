// ============================================================
//  ROUTER.JS
//  Client-side routing with history, params, and guards
// ============================================================

import { EventEmitter } from './EventEmitter.js';

class Router extends EventEmitter {
  // ===== PRIVATE FIELDS =====
  #routes = [];
  #currentRoute = null;
  #history = [];
  #basePath = '';
  #mode = 'history'; // hash | history
  #notFoundHandler = null;
  #guards = [];

  // ===== CONSTRUCTOR =====
  constructor(options = {}) {
    super(options);
    this.#basePath = options.basePath || '';
    this.#mode = options.mode || 'history';
    this.#notFoundHandler = options.notFound || null;

    if (typeof window !== 'undefined') {
      if (this.#mode === 'history') {
        window.addEventListener('popstate', () => this.#handleLocation());
      } else {
        window.addEventListener('hashchange', () => this.#handleLocation());
      }

      // Initial navigation
      setTimeout(() => this.#handleLocation(), 0);
    }
  }

  // ===== PUBLIC METHODS =====
  
  addRoute(path, handler, options = {}) {
    const route = {
      path: this.#normalizePath(path),
      handler: typeof handler === 'function' ? handler : null,
      component: (handler && handler.component) ? handler.component : (options.component || null),
      name: options.name || null,
      meta: options.meta || {},
      guards: options.guards || []
    };

    this.#routes.push(route);
    return this;
  }

  navigate(path, options = {}) {
    const { replace = false, state = {} } = options;
    const normalizedPath = this.#normalizePath(path);

    if (typeof window !== 'undefined') {
      if (this.#mode === 'history') {
        if (replace) {
          window.history.replaceState(state, '', this.#getFullPath(normalizedPath));
        } else {
          window.history.pushState(state, '', this.#getFullPath(normalizedPath));
        }
      } else {
        window.location.hash = normalizedPath;
      }
    }

    this.#handleLocation();

    return this;
  }

  back() {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
    return this;
  }

  forward() {
    if (typeof window !== 'undefined') {
      window.history.forward();
    }
    return this;
  }

  go(delta) {
    if (typeof window !== 'undefined') {
      window.history.go(delta);
    }
    return this;
  }

  addGuard(guard) {
    this.#guards.push(guard);
    return this;
  }

  setNotFound(handler) {
    this.#notFoundHandler = handler;
    return this;
  }

  getCurrentRoute() {
    return this.#currentRoute;
  }

  getHistory() {
    return [...this.#history];
  }

  getPath() {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname + window.location.search;
  }

  // ===== PRIVATE METHODS =====
  
  #handleLocation() {
    const path = this.#getCurrentPath();
    const route = this.#matchRoute(path);

    if (route) {
      const params = this.#extractParams(route.path, path);
      const routeData = {
        path,
        params,
        query: this.#parseQueryString(),
        route: route
      };

      // Run guards
      const canNavigate = this.#runGuards(routeData);
      if (!canNavigate) {
        return;
      }

      this.#currentRoute = routeData;
      this.#history.push(routeData);
      this.emit('navigate', routeData);

      if (route.handler) {
        route.handler(routeData);
      }

      if (route.component) {
        this.emit('component', { component: route.component, data: routeData });
      }
    } else if (this.#notFoundHandler) {
      this.#notFoundHandler(path);
      this.emit('not-found', path);
    } else {
      this.emit('not-found', path);
    }
  }

  #matchRoute(path) {
    const normalizedPath = this.#normalizePath(path);
    
    for (const route of this.#routes) {
      const pattern = this.#routeToRegex(route.path);
      if (pattern.test(normalizedPath)) {
        return route;
      }
    }
    return null;
  }

  #routeToRegex(path) {
    const pattern = path
      .replace(/:(\w+)/g, '([^/]+)')
      .replace(/\*/g, '.*');
    return new RegExp(`^${pattern}$`);
  }

  #extractParams(routePath, actualPath) {
    const params = {};
    const routeParts = routePath.split('/');
    const actualParts = actualPath.split('/');

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        const key = routeParts[i].slice(1);
        params[key] = actualParts[i] || null;
      }
    }

    return params;
  }

  #parseQueryString() {
    if (typeof window === 'undefined') return {};
    const query = {};
    let search = window.location.search ? window.location.search.slice(1) : '';
    if (this.#mode === 'hash' && window.location.hash.includes('?')) {
      search = window.location.hash.split('?')[1] || '';
    }
    if (search) {
      for (const pair of search.split('&')) {
        if (!pair) continue;
        const [key, value] = pair.split('=');
        if (key) {
          query[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
      }
    }
    return query;
  }

  #getCurrentPath() {
    if (typeof window === 'undefined') return '/';
    let raw = '';
    if (this.#mode === 'history') {
      let path = window.location.pathname;
      if (this.#basePath && path.startsWith(this.#basePath)) {
        path = path.slice(this.#basePath.length);
      }
      raw = path || '/';
    } else {
      const hash = window.location.hash.slice(1);
      raw = hash || '/';
    }

    const queryIndex = raw.indexOf('?');
    const pathOnly = queryIndex !== -1 ? raw.slice(0, queryIndex) : raw;
    return pathOnly.startsWith('/') ? pathOnly : '/' + pathOnly;
  }

  #getFullPath(path) {
    return this.#basePath + path;
  }

  #normalizePath(path) {
    return path.startsWith('/') ? path : '/' + path;
  }

  #runGuards(routeData) {
    const allGuards = [...this.#guards, ...(routeData.route.guards || [])];
    
    for (const guard of allGuards) {
      const result = guard(routeData);
      if (result === false) {
        this.emit('guard-failed', { guard, routeData });
        return false;
      }
      if (typeof result === 'string') {
        this.navigate(result);
        return false;
      }
    }
    
    return true;
  }

  // ===== GETTERS =====
  
  get routes() {
    return [...this.#routes];
  }

  get current() {
    return this.#currentRoute;
  }

  get mode() {
    return this.#mode;
  }

  // ===== STATIC METHODS =====
  
  static create(options = {}) {
    return new Router(options);
  }
}

export { Router };

// ============================================================
//  ASSETMANAGER.JS
//  Asset management, preloading, and media rendering system
// ============================================================

import { EventEmitter } from './EventEmitter.js';

class AssetManager extends EventEmitter {
  // ===== PRIVATE FIELDS =====
  #assets = new Map();
  #loaded = new Map();
  #loading = new Map();
  #baseUrl = '';

  // ===== CONSTRUCTOR =====
  constructor(options = {}) {
    super(options);
    this.#baseUrl = options.baseUrl || '';
    if (options.assets) {
      this.registerBundle(options.assets);
    }
  }

  // ===== PUBLIC METHODS =====

  register(name, url, metadata = {}) {
    if (!name || typeof name !== 'string') {
      throw new Error('Asset name must be a valid string');
    }
    if (!url || typeof url !== 'string') {
      throw new Error('Asset url must be a valid string');
    }

    const fullUrl = this.#resolveUrl(url);
    const asset = {
      name,
      url: fullUrl,
      rawUrl: url,
      type: metadata.type || this.#detectType(url),
      alt: metadata.alt || name,
      title: metadata.title || name,
      width: metadata.width || null,
      height: metadata.height || null,
      aspectRatio: metadata.aspectRatio || null,
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      metadata: { ...metadata }
    };

    this.#assets.set(name, asset);
    this.emit('register', { name, asset });
    return this;
  }

  registerBundle(bundle) {
    if (typeof bundle !== 'object' || bundle === null) {
      throw new Error('Bundle must be an object of assets');
    }

    for (const [name, config] of Object.entries(bundle)) {
      if (typeof config === 'string') {
        this.register(name, config);
      } else if (typeof config === 'object' && config !== null) {
        this.register(name, config.url, config);
      }
    }
    return this;
  }

  get(name) {
    return this.#assets.get(name) || null;
  }

  getUrl(name) {
    const asset = this.#assets.get(name);
    return asset ? asset.url : null;
  }

  has(name) {
    return this.#assets.has(name);
  }

  isLoaded(name) {
    return this.#loaded.has(name);
  }

  async loadAssets(names = [], onProgress = null) {
    const targetNames = Array.isArray(names) && names.length > 0
      ? names
      : Array.from(this.#assets.keys());

    let loadedCount = 0;
    const total = targetNames.length;

    const results = await Promise.allSettled(
      targetNames.map(async (name) => {
        try {
          const res = await this.load(name);
          loadedCount++;
          if (typeof onProgress === 'function') {
            onProgress({
              loaded: loadedCount,
              total,
              percent: Math.round((loadedCount / total) * 100),
              current: name,
              asset: res
            });
          }
          return res;
        } catch (err) {
          loadedCount++;
          if (typeof onProgress === 'function') {
            onProgress({
              loaded: loadedCount,
              total,
              percent: Math.round((loadedCount / total) * 100),
              current: name,
              error: err
            });
          }
          throw err;
        }
      })
    );

    this.emit('batch-loaded', { loadedCount, total, results });
    return results;
  }

  async load(name) {
    const asset = this.#assets.get(name);
    if (!asset) {
      throw new Error(`Asset "${name}" not registered`);
    }

    if (this.#loaded.has(name)) {
      return this.#loaded.get(name);
    }

    if (this.#loading.has(name)) {
      return this.#loading.get(name);
    }

    const promise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        this.#loaded.set(name, asset);
        resolve(asset);
        return;
      }

      if (asset.type === 'image') {
        const img = new Image();
        img.referrerPolicy = 'no-referrer';
        img.onload = () => {
          this.#loading.delete(name);
          const loadedData = {
            ...asset,
            element: img,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
          };
          this.#loaded.set(name, loadedData);
          this.emit('loaded', { name, asset: loadedData });
          resolve(loadedData);
        };
        img.onerror = (err) => {
          this.#loading.delete(name);
          const error = new Error(`Failed to load asset "${name}" from ${asset.url}`);
          this.emit('error', { name, error, originalError: err });
          reject(error);
        };
        img.src = asset.url;
      } else {
        // Fallback for non-image assets
        this.#loading.delete(name);
        this.#loaded.set(name, asset);
        this.emit('loaded', { name, asset });
        resolve(asset);
      }
    });

    this.#loading.set(name, promise);
    return promise;
  }

  async preloadAll(onProgress = null) {
    return this.loadAssets([], onProgress);
  }

  createImageElement(name, options = {}) {
    const asset = this.#assets.get(name);
    if (!asset) {
      console.warn(`Asset "${name}" not found in AssetManager`);
    }

    if (typeof document === 'undefined') return null;

    const img = document.createElement('img');
    img.src = asset ? asset.url : (options.fallbackUrl || '');
    img.alt = options.alt || (asset ? asset.alt : 'Image');
    img.referrerPolicy = 'no-referrer';
    
    if (options.id) {
      img.id = options.id;
    }
    if (options.className) {
      img.className = options.className;
    }
    if (options.loading) {
      img.loading = options.loading; // 'lazy' or 'eager'
    } else {
      img.loading = 'lazy';
    }
    if (options.width || (asset && asset.width)) {
      img.width = options.width || asset.width;
    }
    if (options.height || (asset && asset.height)) {
      img.height = options.height || asset.height;
    }

    return img;
  }

  createSvgElement(name, options = {}) {
    const asset = this.#assets.get(name);
    if (typeof document === 'undefined') return null;

    const div = document.createElement('span');
    div.className = options.className || 'inline-flex items-center justify-center';
    if (options.id) div.id = options.id;

    if (asset?.metadata?.svg) {
      div.innerHTML = asset.metadata.svg;
    } else {
      // Return img tag pointing to svg file
      const img = this.createImageElement(name, options);
      if (img) div.appendChild(img);
    }

    return div;
  }

  getSvg(name) {
    const asset = this.#assets.get(name);
    return asset?.metadata?.svg || null;
  }

  clearCache() {
    this.#loaded.clear();
    this.#loading.clear();
    this.emit('clear-cache');
    return this;
  }

  getMeta(name) {
    const asset = this.#assets.get(name);
    return asset ? { ...asset.metadata, title: asset.title, alt: asset.alt, type: asset.type } : null;
  }

  getAll() {
    return Array.from(this.#assets.values());
  }

  getLoaded() {
    return Array.from(this.#loaded.values());
  }

  // ===== PRIVATE METHODS =====

  #resolveUrl(url) {
    if (!this.#baseUrl || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    const cleanBase = this.#baseUrl.endsWith('/') ? this.#baseUrl.slice(0, -1) : this.#baseUrl;
    const cleanUrl = url.startsWith('/') ? url : '/' + url;
    return cleanBase + cleanUrl;
  }

  #detectType(url) {
    const clean = url.split('?')[0].toLowerCase();
    if (/\.(jpg|jpeg|png|webp|gif|svg|avif)$/.test(clean)) {
      return 'image';
    }
    if (/\.(mp4|webm|ogg)$/.test(clean)) {
      return 'video';
    }
    if (/\.(mp3|wav|ogg|aac)$/.test(clean)) {
      return 'audio';
    }
    if (/\.(woff|woff2|ttf|otf|eot)$/.test(clean)) {
      return 'font';
    }
    return 'generic';
  }

  // ===== GETTERS =====

  get size() {
    return this.#assets.size;
  }

  get count() {
    return this.#assets.size;
  }

  get loadedCount() {
    return this.#loaded.size;
  }

  get cache() {
    return {
      size: this.#loaded.size,
      has: (name) => this.#loaded.has(name),
      get: (name) => this.#loaded.get(name)
    };
  }

  // ===== STATIC METHODS =====

  static create(options = {}) {
    return new AssetManager(options);
  }
}

export { AssetManager };

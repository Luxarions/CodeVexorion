// ===== FUNCTIONS =====

function debounce(fn, delay = 300, options = {}) {
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  let result = null;
  const { immediate = false } = options;

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;
    const callNow = immediate && !timeoutId;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        result = fn.apply(lastThis, lastArgs);
        lastArgs = null;
        lastThis = null;
      }
    }, delay);
    if (callNow) {
      result = fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
    return result;
  }

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
      lastThis = null;
    }
  };

  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      result = fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
      return result;
    }
    return result;
  };

  return debounced;
}

function throttle(fn, interval = 300, options = {}) {
  const { leading = true, trailing = true } = options;
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;
  let lastCallTime = 0;
  let result = null;

  function throttled(...args) {
    const now = Date.now();
    const remaining = interval - (now - lastCallTime);
    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > interval) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCallTime = now;
      result = fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
      return result;
    }

    if (trailing && !timeoutId) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
        lastCallTime = Date.now();
        result = fn.apply(lastThis, lastArgs);
        lastArgs = null;
        lastThis = null;
      }, remaining);
    }

    return result;
  }

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastArgs = null;
      lastThis = null;
    }
  };

  throttled.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
      lastCallTime = Date.now();
      result = fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
      return result;
    }
    return result;
  };

  return throttled;
}

function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj.source, obj.flags);
  }

  if (obj instanceof Map) {
    const map = new Map();
    for (const [key, value] of obj) {
      map.set(deepClone(key), deepClone(value));
    }
    return map;
  }

  if (obj instanceof Set) {
    const set = new Set();
    for (const value of obj) {
      set.add(deepClone(value));
    }
    return set;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }

  const cloned = {};
  for (const key of Object.keys(obj)) {
    cloned[key] = deepClone(obj[key]);
  }
  return cloned;
}

function randomId(length = 8, prefix = '') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = prefix;
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    return 'Invalid Date';
  }

  const pad = (n, len = 2) => String(n).padStart(len, '0');

  const replacements = {
    'YYYY': d.getFullYear(),
    'YY': String(d.getFullYear()).slice(-2),
    'MM': pad(d.getMonth() + 1),
    'M': d.getMonth() + 1,
    'DD': pad(d.getDate()),
    'D': d.getDate(),
    'HH': pad(d.getHours()),
    'H': d.getHours(),
    'mm': pad(d.getMinutes()),
    'm': d.getMinutes(),
    'ss': pad(d.getSeconds()),
    's': d.getSeconds(),
    'SSS': pad(d.getMilliseconds(), 3)
  };

  return format.replace(/YYYY|YY|MM|M|DD|D|HH|H|mm|m|ss|s|SSS/g, match => replacements[match]);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isArray(value) {
  return Array.isArray(value);
}

function isEmpty(obj) {
  if (obj === null || obj === undefined) {
    return true;
  }
  if (typeof obj === 'string' || Array.isArray(obj)) {
    return obj.length === 0;
  }
  if (obj instanceof Map || obj instanceof Set) {
    return obj.size === 0;
  }
  if (typeof obj === 'object') {
    return Object.keys(obj).length === 0;
  }
  return false;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function memoize(fn, resolver) {
  const cache = new Map();

  return function memoized(...args) {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

// ===== EXPORT DI AKHIR =====
export {
  debounce,
  throttle,
  deepClone,
  randomId,
  formatDate,
  isObject,
  isArray,
  isEmpty,
  sleep,
  memoize
};

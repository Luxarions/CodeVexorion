import { debounce, throttle, isObject } from './Misc.js';

// ===== FUNCTIONS =====

function querySelector(selector, context = typeof document !== 'undefined' ? document : null) {
  try {
    return context ? context.querySelector(selector) : null;
  } catch (error) {
    console.warn(`Query selector failed for "${selector}":`, error);
    return null;
  }
}

function querySelectorAll(selector, context = typeof document !== 'undefined' ? document : null) {
  try {
    return context ? context.querySelectorAll(selector) : [];
  } catch (error) {
    console.warn(`Query selector all failed for "${selector}":`, error);
    return [];
  }
}

function addClass(element, className) {
  const el = typeof element === 'string' ? querySelector(element) : element;
  if (!el) return false;

  const classes = Array.isArray(className) ? className : [className];
  el.classList.add(...classes);
  return true;
}

function removeClass(element, className) {
  const el = typeof element === 'string' ? querySelector(element) : element;
  if (!el) return false;

  const classes = Array.isArray(className) ? className : [className];
  el.classList.remove(...classes);
  return true;
}

function toggleClass(element, className, force) {
  const el = typeof element === 'string' ? querySelector(element) : element;
  if (!el) return false;

  const result = force !== undefined ? el.classList.toggle(className, force) : el.classList.toggle(className);
  return result;
}

function hasClass(element, className) {
  const el = typeof element === 'string' ? querySelector(element) : element;
  if (!el) return false;

  return el.classList.contains(className);
}

function setStyle(element, styles, value) {
  const el = typeof element === 'string' ? querySelector(element) : element;
  if (!el) return false;

  if (typeof styles === 'string') {
    el.style[styles] = value;
    return true;
  }

  if (isObject(styles)) {
    for (const [prop, val] of Object.entries(styles)) {
      el.style[prop] = val;
    }
    return true;
  }

  return false;
}

function getStyle(element, property, computed = true) {
  const el = typeof element === 'string' ? querySelector(element) : element;
  if (!el) return undefined;

  if (computed && typeof getComputedStyle !== 'undefined') {
    return getComputedStyle(el)[property];
  }
  return el.style[property];
}

function createElement(tagName, attributes = {}, children = null) {
  if (typeof document === 'undefined') return null;
  const element = document.createElement(tagName);

  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null) continue;
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset' && isObject(value)) {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        element.dataset[dataKey] = dataValue;
      }
    } else if (key === 'style' && isObject(value)) {
      setStyle(element, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      element.setAttribute(key, value);
    }
  }

  if (children) {
    appendChild(element, children);
  }

  return element;
}

function appendChild(parent, children) {
  const el = typeof parent === 'string' ? querySelector(parent) : parent;
  if (!el) return null;

  const childArr = Array.isArray(children) ? children : [children];
  for (const child of childArr) {
    if (child === null || child === undefined) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      el.appendChild(document.createTextNode(String(child)));
    } else if (typeof Element !== 'undefined' && child instanceof Element) {
      el.appendChild(child);
    } else if (typeof Node !== 'undefined' && child instanceof Node) {
      el.appendChild(child);
    }
  }

  return el;
}

function removeChild(child) {
  const el = typeof child === 'string' ? querySelector(child) : child;
  if (!el || !el.parentNode) return null;

  return el.parentNode.removeChild(el);
}

function onEvent(target, event, callback, options = {}) {
  const el = typeof target === 'string' ? querySelector(target) : target;
  if (!el) {
    console.warn(`Event target not found: ${target}`);
    return () => {};
  }

  let handler = callback;

  if (options.debounce) {
    handler = debounce(callback, options.debounce);
  }

  if (options.throttle) {
    handler = throttle(callback, options.throttle);
  }

  const listenerOptions = options.listenerOptions || false;
  el.addEventListener(event, handler, listenerOptions);

  return () => {
    el.removeEventListener(event, handler, listenerOptions);
  };
}

function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const existing = querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') {
      return reject(new Error('MutationObserver or document not available'));
    }

    const observer = new MutationObserver(() => {
      const element = querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
    }, timeout);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  });
}

function isVisible(element) {
  const el = typeof element === 'string' ? querySelector(element) : element;
  if (!el || typeof getComputedStyle === 'undefined') return false;

  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);

  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}

function scrollIntoView(element, options = {}) {
  const el = typeof element === 'string' ? querySelector(element) : element;
  if (!el || !el.scrollIntoView) return false;

  el.scrollIntoView({
    behavior: options.behavior || 'smooth',
    block: options.block || 'center',
    inline: options.inline || 'center'
  });

  return true;
}

// ===== EXPORT DI AKHIR =====
export {
  querySelector,
  querySelectorAll,
  addClass,
  removeClass,
  toggleClass,
  hasClass,
  setStyle,
  getStyle,
  createElement,
  appendChild,
  removeChild,
  onEvent,
  waitForElement,
  isVisible,
  scrollIntoView
};

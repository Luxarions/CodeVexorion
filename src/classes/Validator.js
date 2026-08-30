// ============================================================
//  VALIDATOR.JS
//  Advanced validation with rules, schemas, and custom validators
// ============================================================

import { EventEmitter } from './EventEmitter.js';

class Validator extends EventEmitter {
  // ===== PRIVATE FIELDS =====
  #rules = new Map();
  #schemas = new Map();
  #customValidators = new Map();
  #messages = {
    required: 'This field is required',
    min: 'Must be at least {min}',
    max: 'Must be at most {max}',
    minLength: 'Must be at least {min} characters',
    maxLength: 'Must be at most {max} characters',
    email: 'Must be a valid email',
    url: 'Must be a valid URL',
    number: 'Must be a number',
    integer: 'Must be an integer',
    boolean: 'Must be a boolean',
    enum: 'Must be one of: {values}',
    pattern: 'Invalid format',
    custom: 'Validation failed'
  };

  // ===== CONSTRUCTOR =====
  constructor(options = {}) {
    super(options);
    if (options.messages) {
      this.#messages = { ...this.#messages, ...options.messages };
    }
    this.#setupDefaultRules();
  }

  // ===== PUBLIC METHODS =====
  
  validate(value, rules) {
    const errors = [];

    if (typeof rules === 'function') {
      const result = rules(value);
      if (result !== true) {
        errors.push({
          rule: 'custom',
          message: typeof result === 'string' ? result : this.#messages.custom
        });
      }
      return errors;
    }

    const ruleArray = typeof rules === 'string' 
      ? rules.split('|').map(r => r.trim()) 
      : Array.isArray(rules) ? rules : [rules];

    for (const rule of ruleArray) {
      const [name, param] = rule.includes(':') 
        ? rule.split(':') 
        : [rule, null];
      
      const error = this.#applyRule(name, value, param);
      if (error) {
        errors.push(error);
      }
    }

    return errors;
  }

  validateSchema(data, schemaName) {
    const schema = this.#schemas.get(schemaName);
    if (!schema) {
      throw new Error(`Schema "${schemaName}" not found`);
    }

    const errors = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(schema)) {
      const value = data ? data[field] : undefined;
      const fieldErrors = this.validate(value, rules);
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
        isValid = false;
      }
    }

    this.emit('validate', { schema: schemaName, data, errors, isValid });
    return { isValid, errors };
  }

  addRule(name, validator, message = null) {
    this.#rules.set(name, {
      validator: typeof validator === 'function' ? validator : null,
      message: message || this.#messages[name] || 'Invalid'
    });
    return this;
  }

  addSchema(name, schema) {
    this.#schemas.set(name, schema);
    return this;
  }

  addCustomValidator(name, fn, message = null) {
    this.#customValidators.set(name, {
      validator: fn,
      message: message || 'Custom validation failed'
    });
    return this;
  }

  setMessage(rule, message) {
    this.#messages[rule] = message;
    return this;
  }

  isRequired(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  }

  // ===== PRIVATE METHODS =====
  
  #setupDefaultRules() {
    // Required
    this.#rules.set('required', {
      validator: (value) => this.isRequired(value),
      message: this.#messages.required
    });

    // Min
    this.#rules.set('min', {
      validator: (value, min) => {
        if (!this.isRequired(value)) return true;
        const num = Number(value);
        return !isNaN(num) && num >= Number(min);
      },
      message: this.#messages.min
    });

    // Max
    this.#rules.set('max', {
      validator: (value, max) => {
        if (!this.isRequired(value)) return true;
        const num = Number(value);
        return !isNaN(num) && num <= Number(max);
      },
      message: this.#messages.max
    });

    // MinLength
    this.#rules.set('minLength', {
      validator: (value, min) => {
        if (!this.isRequired(value)) return true;
        return String(value).length >= Number(min);
      },
      message: this.#messages.minLength
    });

    // MaxLength
    this.#rules.set('maxLength', {
      validator: (value, max) => {
        if (!this.isRequired(value)) return true;
        return String(value).length <= Number(max);
      },
      message: this.#messages.maxLength
    });

    // Email
    this.#rules.set('email', {
      validator: (value) => {
        if (!this.isRequired(value)) return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      },
      message: this.#messages.email
    });

    // URL
    this.#rules.set('url', {
      validator: (value) => {
        if (!this.isRequired(value)) return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: this.#messages.url
    });

    // Number
    this.#rules.set('number', {
      validator: (value) => {
        if (!this.isRequired(value)) return true;
        return !isNaN(Number(value));
      },
      message: this.#messages.number
    });

    // Integer
    this.#rules.set('integer', {
      validator: (value) => {
        if (!this.isRequired(value)) return true;
        return Number.isInteger(Number(value));
      },
      message: this.#messages.integer
    });

    // Boolean
    this.#rules.set('boolean', {
      validator: (value) => {
        if (!this.isRequired(value)) return true;
        return typeof value === 'boolean' || value === 'true' || value === 'false';
      },
      message: this.#messages.boolean
    });

    // Enum
    this.#rules.set('enum', {
      validator: (value, values) => {
        if (!this.isRequired(value)) return true;
        const allowed = values.split(',').map(v => v.trim());
        return allowed.includes(value);
      },
      message: this.#messages.enum
    });

    // Pattern
    this.#rules.set('pattern', {
      validator: (value, pattern) => {
        if (!this.isRequired(value)) return true;
        try {
          const regex = new RegExp(pattern);
          return regex.test(value);
        } catch {
          return false;
        }
      },
      message: this.#messages.pattern
    });
  }

  #applyRule(ruleName, value, param) {
    // Check custom validators first
    if (this.#customValidators.has(ruleName)) {
      const custom = this.#customValidators.get(ruleName);
      const result = custom.validator(value, param);
      if (result !== true) {
        return {
          rule: ruleName,
          message: typeof result === 'string' ? result : custom.message
        };
      }
      return null;
    }

    // Check built-in rules
    const rule = this.#rules.get(ruleName);
    if (!rule) {
      return null;
    }

    try {
      const result = rule.validator(value, param);
      if (result !== true) {
        const message = this.#formatMessage(rule.message, { param, min: param, max: param, values: param });
        return { rule: ruleName, message };
      }
    } catch (error) {
      return { rule: ruleName, message: error.message };
    }

    return null;
  }

  #formatMessage(message, data) {
    return message.replace(/{(\w+)}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
  }

  // ===== STATIC METHODS =====
  
  static create(options = {}) {
    return new Validator(options);
  }

  static combine(validators) {
    return (value) => {
      for (const validator of validators) {
        const result = validator(value);
        if (result !== true) {
          return result;
        }
      }
      return true;
    };
  }
}

export { Validator };

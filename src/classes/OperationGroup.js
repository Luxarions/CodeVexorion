import { EventEmitter } from './EventEmitter.js';

class OperationGroup extends EventEmitter {
  // ===== PUBLIC PROPERTIES =====
  name = 'OperationGroup';
  
  // ===== PRIVATE FIELDS =====
  #operations = [];
  #history = [];
  #maxHistory = 100;
  #isExecuting = false;

  // ===== CONSTRUCTOR =====
  constructor(options = {}) {
    super(options);
    this.name = options.name || 'OperationGroup';
    this.#maxHistory = options.maxHistory || 100;
  }

  // ===== PUBLIC METHODS =====
  
  addOperation(operation) {
    const id = operation.id || this.#generateId();
    const op = {
      id,
      name: operation.name || 'Unnamed',
      execute: operation.execute,
      undo: operation.undo || null,
      metadata: operation.metadata || {},
      timestamp: Date.now()
    };
    
    this.#operations.push(op);
    this.emit('add', op);
    return id;
  }

  removeOperation(id) {
    const index = this.#operations.findIndex(op => op.id === id);
    if (index === -1) {
      throw new Error(`Operation "${id}" not found`);
    }
    
    const removed = this.#operations.splice(index, 1)[0];
    this.emit('remove', removed);
    return removed;
  }

  execute(id = null) {
    if (this.#isExecuting) {
      throw new Error('Already executing');
    }

    this.#isExecuting = true;
    this.emit('start');

    try {
      if (id === null) {
        for (const op of this.#operations) {
          this.#executeOperation(op);
        }
      } else {
        const op = this.#operations.find(op => op.id === id);
        if (!op) {
          throw new Error(`Operation "${id}" not found`);
        }
        this.#executeOperation(op);
      }
    } catch (error) {
      this.emit('error', error);
      throw error;
    } finally {
      this.#isExecuting = false;
      this.emit('end');
    }

    return this;
  }

  undo(id = null) {
    if (this.#isExecuting) {
      throw new Error('Already executing');
    }

    this.#isExecuting = true;
    this.emit('undo-start');

    try {
      if (id === null) {
        for (let i = this.#history.length - 1; i >= 0; i--) {
          const entry = this.#history[i];
          if (entry.operation.undo) {
            entry.operation.undo(entry.result);
          }
        }
        this.#history = [];
      } else {
        const index = this.#history.findIndex(entry => entry.operation.id === id);
        if (index === -1) {
          throw new Error(`Operation "${id}" not found in history`);
        }
        
        const entry = this.#history[index];
        if (entry.operation.undo) {
          entry.operation.undo(entry.result);
        }
        this.#history.splice(index, 1);
      }
    } catch (error) {
      this.emit('error', error);
      throw error;
    } finally {
      this.#isExecuting = false;
      this.emit('undo-end');
    }

    return this;
  }

  getHistory() {
    return [...this.#history];
  }

  getOperations() {
    return [...this.#operations];
  }

  clearHistory() {
    this.#history = [];
    this.emit('clear-history');
    return this;
  }

  clearAll() {
    this.#operations = [];
    this.#history = [];
    this.emit('clear-all');
    return this;
  }

  getOperation(id) {
    return this.#operations.find(op => op.id === id) || null;
  }

  // ===== PRIVATE METHODS =====
  
  #executeOperation(operation) {
    const result = operation.execute();
    this.#history.push({
      operation,
      result,
      timestamp: Date.now()
    });

    if (this.#history.length > this.#maxHistory) {
      this.#history.shift();
    }

    this.emit('execute', { operation, result });
    return result;
  }

  #generateId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = 'op_';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  // ===== GETTERS =====
  
  get count() {
    return this.#operations.length;
  }

  get historyCount() {
    return this.#history.length;
  }

  get isExecuting() {
    return this.#isExecuting;
  }

  get maxHistory() {
    return this.#maxHistory;
  }

  // ===== SETTERS =====
  
  set maxHistory(value) {
    if (typeof value !== 'number' || value < 1) {
      throw new Error('maxHistory must be a positive number');
    }
    this.#maxHistory = value;
    
    while (this.#history.length > this.#maxHistory) {
      this.#history.shift();
    }
  }

  // ===== STATIC METHODS =====
  
  static create(operations = [], options = {}) {
    const group = new OperationGroup(options);
    for (const op of operations) {
      group.addOperation(op);
    }
    return group;
  }
}

// ===== EXPORT DI AKHIR =====
export { OperationGroup };

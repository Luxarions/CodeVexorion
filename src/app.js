// ============================================================
//  APP.JS - Vexorion Complete Interactive Application
// ============================================================

import {
  // Core
  getDetectionResult,
  getFlatFlags,
  debounce,
  throttle,
  deepClone,
  randomId,
  formatDate,
  querySelector,
  querySelectorAll,
  createElement,
  appendChild,
  onEvent,
  addClass,
  removeClass,
  setStyle,

  // Classes
  EventEmitter,
  StringStream,
  Bidirectional,
  OperationGroup,
  StateManager,
  CacheManager,
  Logger,
  Validator,
  Router,
  Store,

  // Modes
  DarkMode,
  LightMode,
  AccessibilityMode,
  CompactMode,
  DeveloperMode,

  // Plugins
  PluginSystem,
  Middleware,
  Hooks
} from './index.js';

class VexorionApp {
  constructor() {
    // Setup Logger
    this.logger = new Logger({
      level: 'debug',
      context: { app: 'Vexorion' }
    });

    // Setup Store
    this.store = new Store({
      initialState: {
        theme: 'dark',
        user: { name: 'Developer', role: 'Architect' },
        todos: [
          { id: 1, text: 'Inspect Browser & Engine flags', done: true },
          { id: 2, text: 'Test StateManager undo/redo capability', done: false },
          { id: 3, text: 'Stream chunks through StringStream', done: false },
          { id: 4, text: 'Validate schemas with custom rules', done: false }
        ],
        counter: 0
      },
      persistenceKey: 'vexorion_app_store'
    });

    // Setup StateManager for interactive state lab
    this.stateManager = new StateManager({
      user: {
        profile: {
          username: 'vexor_dev',
          email: 'dev@vexorion.io',
          tier: 'enterprise'
        },
        settings: {
          notifications: true,
          syncInterval: 15
        }
      },
      metrics: {
        uptime: '99.98%',
        requests: 4820
      }
    });

    // Setup CacheManager
    this.cache = new CacheManager({
      defaultTTL: 60000,
      maxSize: 10,
      strategy: 'lru',
      persistenceKey: 'vexorion_cache'
    });

    // Seed sample cache items
    this.cache.set('config:api_endpoint', 'https://api.vexorion.io/v1');
    this.cache.set('session:token', 'vx_sec_' + randomId(16));
    this.cache.set('theme:preference', 'dark');

    // Setup OperationGroup
    this.opGroup = new OperationGroup({ name: 'SystemMaintenance' });

    // Setup Validator
    this.validator = new Validator();
    this.validator.addSchema('userProfile', {
      username: 'required|minLength:4|maxLength:20',
      email: 'required|email',
      age: 'required|integer|min:18|max:120',
      role: 'required|enum:developer,designer,manager,architect'
    });

    // Setup Modes
    this.setupModes();

    // Setup Plugin System
    this.setupPlugins();

    // Setup Router (using hash mode for reliable preview navigation)
    this.router = new Router({
      mode: 'hash',
      basePath: ''
    });

    this.init();
  }

  setupModes() {
    this.darkMode = new DarkMode();
    this.lightMode = new LightMode();
    this.accessibilityMode = new AccessibilityMode();
    this.compactMode = new CompactMode();
    this.developerMode = new DeveloperMode();

    this.modes = {
      dark: this.darkMode,
      light: this.lightMode,
      accessibility: this.accessibilityMode,
      compact: this.compactMode,
      developer: this.developerMode
    };

    // Default to dark mode
    this.currentModeName = 'dark';
    this.darkMode.activate();
  }

  setupPlugins() {
    this.pluginSystem = new PluginSystem({ logger: this.logger });

    // 1. Analytics Plugin
    this.pluginSystem.register({
      name: 'AnalyticsPlugin',
      install: (sys) => {
        sys.registerHook('page-view', (path) => {
          this.logger.info(`[Analytics] Tracked page view: ${path}`);
          return path;
        });
        sys.registerHook('button-click', (data) => {
          this.logger.debug(`[Analytics] Action triggered: ${data}`);
          return data;
        });
      }
    });

    // 2. Performance Plugin
    this.pluginSystem.register({
      name: 'PerformanceMonitor',
      install: (sys) => {
        sys.registerHook('render-benchmark', (component) => {
          const t0 = performance.now();
          return () => {
            const duration = (performance.now() - t0).toFixed(2);
            this.logger.debug(`[Performance] ${component} rendered in ${duration}ms`);
          };
        });
      }
    });
  }

  init() {
    this.logger.info('Initializing Vexorion Application UI...');

    // Setup Reducers
    this.store.addReducer('ADD_TODO', (state, payload) => ({
      ...state,
      todos: [...state.todos, payload]
    }));

    this.store.addReducer('TOGGLE_TODO', (state, payload) => ({
      ...state,
      todos: state.todos.map(t => t.id === payload ? { ...t, done: !t.done } : t)
    }));

    this.store.addReducer('REMOVE_TODO', (state, payload) => ({
      ...state,
      todos: state.todos.filter(t => t.id !== payload)
    }));

    this.store.addReducer('INCREMENT_COUNTER', (state) => ({
      ...state,
      counter: state.counter + 1
    }));

    this.store.addReducer('RESET_COUNTER', (state) => ({
      ...state,
      counter: 0
    }));

    // Setup Routes
    this.setupRoutes();

    // Render Shell Layout
    this.renderLayout();

    this.logger.info('Vexorion Framework Loaded Successfully!');
  }

  setupRoutes() {
    this.router
      .addRoute('/', () => this.renderHome())
      .addRoute('/todos', () => this.renderTodos())
      .addRoute('/state', () => this.renderStateLab())
      .addRoute('/cache', () => this.renderCacheLab())
      .addRoute('/browser', () => this.renderBrowserLab())
      .addRoute('/stream', () => this.renderStreamLab())
      .addRoute('/validator', () => this.renderValidatorLab())
      .addRoute('/logger', () => this.renderLoggerLab())
      .addRoute('/quickstart', () => this.renderQuickStart())
      .setNotFound(() => this.renderNotFound());

    this.router.on('navigate', (data) => {
      this.pluginSystem.runHook('page-view', data.path);
      this.updateActiveNav(data.path);
    });
  }

  switchMode(modeName) {
    if (!this.modes[modeName]) return;

    // Deactivate current
    Object.values(this.modes).forEach(m => m.deactivate());

    // Activate new
    this.modes[modeName].activate();
    this.currentModeName = modeName;
    this.logger.info(`Switched active theme mode to: ${modeName}`);

    // Update active button state
    querySelectorAll('.mode-btn').forEach(btn => {
      if (btn.dataset.mode === modeName) {
        btn.classList.add('bg-indigo-600', 'text-white');
        btn.classList.remove('text-slate-400', 'hover:bg-slate-800');
      } else {
        btn.classList.remove('bg-indigo-600', 'text-white');
        btn.classList.add('text-slate-400', 'hover:bg-slate-800');
      }
    });
  }

  renderLayout() {
    const app = querySelector('#app');
    if (!app) return;
    app.innerHTML = '';

    // Shell Container
    const shell = createElement('div', {
      className: 'min-h-screen flex flex-col transition-colors duration-200'
    });

    // 1. Navigation Header
    const header = createElement('header', {
      className: 'sticky top-0 z-50 backdrop-blur-md border-b px-4 lg:px-8 py-3 flex items-center justify-between transition-colors duration-200',
      style: {
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)'
      }
    });

    // Logo & Brand
    const brand = createElement('div', {
      className: 'flex items-center space-x-3 cursor-pointer',
      onclick: () => this.router.navigate('/')
    }, [
      createElement('div', {
        className: 'w-9 h-9 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center font-black text-white text-lg shadow-md'
      }, 'V'),
      createElement('div', {}, [
        createElement('div', { className: 'font-bold tracking-tight text-base flex items-center gap-2' }, [
          createElement('span', {}, 'VEXORION'),
          createElement('span', {
            className: 'text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
          }, 'Core v2.4')
        ]),
        createElement('div', { className: 'text-xs text-slate-400 font-normal' }, 'Pure Custom JS Framework')
      ])
    ]);

    // Navigation Links
    const nav = createElement('nav', {
      className: 'hidden md:flex items-center space-x-1 font-medium text-sm'
    });

    const routes = [
      { path: '/', label: 'Overview', icon: '⚡' },
      { path: '/todos', label: 'Todo & Binding', icon: '📝' },
      { path: '/state', label: 'StateManager', icon: '🔄' },
      { path: '/cache', label: 'Cache System', icon: '💾' },
      { path: '/browser', label: 'Browser Info', icon: '🌐' },
      { path: '/stream', label: 'Stream & Ops', icon: '🌊' },
      { path: '/validator', label: 'Validator', icon: '🛡️' },
      { path: '/logger', label: 'Logs', icon: '📋' },
      { path: '/quickstart', label: 'Quick Start', icon: '🚀' }
    ];

    routes.forEach(route => {
      const link = createElement('button', {
        className: 'nav-link px-3 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 text-xs font-medium',
        dataset: { path: route.path },
        onclick: () => this.router.navigate(route.path)
      }, [
        createElement('span', {}, route.icon),
        createElement('span', {}, route.label)
      ]);
      nav.appendChild(link);
    });

    // Theme Mode Switcher
    const modeSwitcher = createElement('div', {
      className: 'flex items-center p-1 rounded-lg border text-xs gap-0.5',
      style: {
        backgroundColor: 'var(--bg-tertiary)',
        borderColor: 'var(--border-color)'
      }
    });

    const modeList = [
      { name: 'dark', icon: '🌙', title: 'Dark' },
      { name: 'light', icon: '☀️', title: 'Light' },
      { name: 'accessibility', icon: '👁️', title: 'A11y' },
      { name: 'compact', icon: '📐', title: 'Compact' }
    ];

    modeList.forEach(m => {
      const btn = createElement('button', {
        className: `mode-btn px-2.5 py-1 rounded transition-all font-medium flex items-center gap-1 ${
          m.name === this.currentModeName ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
        }`,
        dataset: { mode: m.name },
        title: `${m.title} Mode`,
        onclick: () => this.switchMode(m.name)
      }, [
        createElement('span', {}, m.icon),
        createElement('span', { className: 'hidden sm:inline' }, m.title)
      ]);
      modeSwitcher.appendChild(btn);
    });

    header.appendChild(brand);
    header.appendChild(nav);
    header.appendChild(modeSwitcher);

    // Mobile nav bar
    const mobileNav = createElement('div', {
      className: 'md:hidden flex overflow-x-auto py-2 px-4 gap-2 border-b text-xs',
      style: {
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)'
      }
    });

    routes.forEach(route => {
      const mLink = createElement('button', {
        className: 'nav-link-mobile whitespace-nowrap px-2.5 py-1 rounded-md border text-xs font-medium',
        dataset: { path: route.path },
        onclick: () => this.router.navigate(route.path)
      }, `${route.icon} ${route.label}`);
      mobileNav.appendChild(mLink);
    });

    // Main Content Area
    const main = createElement('main', {
      id: 'main-view',
      className: 'flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 transition-colors duration-200'
    });

    // Footer
    const footer = createElement('footer', {
      className: 'border-t py-6 px-4 md:px-8 text-center text-xs transition-colors duration-200 flex flex-col sm:flex-row items-center justify-between gap-4',
      style: {
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-secondary)'
      }
    }, [
      createElement('div', { className: 'flex items-center gap-2' }, [
        createElement('span', { className: 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse' }),
        createElement('span', {}, 'Vexorion Custom Engine • All Modules Active')
      ]),
      createElement('div', { className: 'font-mono' }, 'Pure JavaScript • Zero Dependencies • Modularity & Performance'),
      createElement('div', {}, '© 2026 Vexorion Framework')
    ]);

    shell.appendChild(header);
    shell.appendChild(mobileNav);
    shell.appendChild(main);
    shell.appendChild(footer);

    app.appendChild(shell);
  }

  updateActiveNav(currentPath) {
    querySelectorAll('.nav-link, .nav-link-mobile').forEach(link => {
      const p = link.dataset.path;
      const isActive = (p === '/' && (currentPath === '/' || currentPath === '')) || (p !== '/' && currentPath.startsWith(p));
      if (isActive) {
        link.classList.add('bg-indigo-600/20', 'text-indigo-400', 'font-semibold', 'border-indigo-500/30');
      } else {
        link.classList.remove('bg-indigo-600/20', 'text-indigo-400', 'font-semibold', 'border-indigo-500/30');
      }
    });
  }

  // ==========================================
  // PAGE 1: HOME & OVERVIEW
  // ==========================================
  renderHome() {
    const main = querySelector('#main-view');
    if (!main) return;
    main.innerHTML = '';

    const container = createElement('div', { className: 'space-y-8 animate-fade-in' });

    // Hero Banner
    const hero = createElement('div', {
      className: 'rounded-2xl p-6 md:p-10 border relative overflow-hidden',
      style: {
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)'
      }
    }, [
      createElement('div', { className: 'max-w-3xl space-y-4 relative z-10' }, [
        createElement('div', { className: 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' }, [
          createElement('span', { className: 'w-2 h-2 rounded-full bg-indigo-400' }),
          createElement('span', {}, 'Autonomous JavaScript Architecture')
        ]),
        createElement('h1', { className: 'text-3xl md:text-5xl font-black tracking-tight' }, 'The Vexorion Ecosystem'),
        createElement('p', { className: 'text-base md:text-lg leading-relaxed', style: { color: 'var(--text-secondary)' } },
          'A handcrafted, modular JavaScript engine providing core hardware & engine detection, reactive event emitters, bidirectional bindings, state history tracking, high-efficiency caching, and multi-mode theme systems.'
        ),
        createElement('div', { className: 'flex flex-wrap gap-3 pt-2' }, [
          createElement('button', {
            className: 'px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md flex items-center gap-2',
            onclick: () => this.router.navigate('/todos')
          }, '🚀 Launch Interactive Todo Lab'),
          createElement('button', {
            className: 'px-5 py-2.5 rounded-lg border font-medium text-sm transition-all hover:bg-slate-800/50 flex items-center gap-2',
            style: { borderColor: 'var(--border-color)' },
            onclick: () => this.router.navigate('/quickstart')
          }, '📖 View Quick Start & Sandbox')
        ])
      ])
    ]);

    // Live Metrics Bento Grid
    const grid = createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-5' });

    const cards = [
      {
        title: 'Core Engine & Detection',
        desc: 'Zero-dependency regex parser for Gecko, WebKit, Presto, Chrome, Safari, OS platform & hardware features.',
        icon: '🌐',
        badge: 'Browser.js',
        action: () => this.router.navigate('/browser')
      },
      {
        title: 'Reactive State & Time-Travel',
        desc: 'StateManager with path queries, deep clones, and 50-step undo/redo rollback stack.',
        icon: '🔄',
        badge: 'StateManager.js',
        action: () => this.router.navigate('/state')
      },
      {
        title: 'Multi-Strategy Cache',
        desc: 'CacheManager with LRU, LFU, FIFO eviction, millisecond TTL expiration, and persistence.',
        icon: '💾',
        badge: 'CacheManager.js',
        action: () => this.router.navigate('/cache')
      },
      {
        title: 'Bidirectional Binding',
        desc: 'Sync DOM inputs with store state in real-time with custom transform pipelines.',
        icon: '⚡',
        badge: 'Bidirectional.js',
        action: () => this.router.navigate('/todos')
      },
      {
        title: 'Stream & Batch Operations',
        desc: 'In-memory chunk streaming with pipe handling and transactional OperationGroup undo.',
        icon: '🌊',
        badge: 'StringStream.js',
        action: () => this.router.navigate('/stream')
      },
      {
        title: 'Schema Validator',
        desc: 'Rule engine supporting regex, email, ranges, enums, min/max length, and custom callbacks.',
        icon: '🛡️',
        badge: 'Validator.js',
        action: () => this.router.navigate('/validator')
      }
    ];

    cards.forEach(c => {
      const card = createElement('div', {
        className: 'rounded-xl p-5 border flex flex-col justify-between hover:border-indigo-500/50 transition-all group cursor-pointer',
        style: {
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)'
        },
        onclick: c.action
      }, [
        createElement('div', { className: 'space-y-3' }, [
          createElement('div', { className: 'flex items-center justify-between' }, [
            createElement('span', { className: 'text-2xl' }, c.icon),
            createElement('span', { className: 'text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' }, c.badge)
          ]),
          createElement('h3', { className: 'font-bold text-lg group-hover:text-indigo-400 transition-colors' }, c.title),
          createElement('p', { className: 'text-sm leading-relaxed', style: { color: 'var(--text-secondary)' } }, c.desc)
        ]),
        createElement('div', { className: 'pt-4 flex items-center text-xs font-medium text-indigo-400 gap-1' }, [
          createElement('span', {}, 'Explore module'),
          createElement('span', { className: 'group-hover:translate-x-1 transition-transform' }, '→')
        ])
      ]);
      grid.appendChild(card);
    });

    container.appendChild(hero);
    container.appendChild(grid);
    main.appendChild(container);
  }

  // ==========================================
  // PAGE 2: TODO & BIDIRECTIONAL BINDING
  // ==========================================
  renderTodos() {
    const main = querySelector('#main-view');
    if (!main) return;
    main.innerHTML = '';

    const container = createElement('div', { className: 'space-y-6 max-w-4xl mx-auto' });

    // Title
    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-2xl md:text-3xl font-bold' }, '📝 Todo App with Bidirectional Binding'),
      createElement('p', { className: 'text-sm', style: { color: 'var(--text-secondary)' } },
        'Demonstrating two-way DOM sync using Bidirectional.js bound with Store.js reducers and EventEmitter.'
      )
    ]);

    // Live binding preview banner
    const liveSyncBanner = createElement('div', {
      className: 'p-3 rounded-lg border flex items-center justify-between text-xs font-mono',
      style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('div', { className: 'flex items-center gap-2' }, [
        createElement('span', { className: 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse' }),
        createElement('span', {}, 'Bidirectional Input Stream:')
      ]),
      createElement('span', { id: 'live-input-mirror', className: 'text-indigo-400 font-bold' }, '(type below to preview live binding)')
    ]);

    // Input form
    const formCard = createElement('div', {
      className: 'p-5 rounded-xl border space-y-4',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const inputGroup = createElement('div', { className: 'flex gap-3' });

    const input = createElement('input', {
      id: 'todo-input-field',
      type: 'text',
      placeholder: 'Enter new task item...',
      className: 'flex-1 px-4 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all',
      style: {
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)'
      }
    });

    const addBtn = createElement('button', {
      className: 'px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-sm'
    }, '+ Add Todo');

    inputGroup.appendChild(input);
    inputGroup.appendChild(addBtn);
    formCard.appendChild(inputGroup);

    // Bind input field bidirectionally
    const mirrorEl = liveSyncBanner.querySelector('#live-input-mirror');
    const binder = new Bidirectional({
      twoWay: true,
      immediate: false,
      transform: (val) => val ? `"${val}" [${val.length} chars]` : '(empty)'
    });

    binder.bind(
      () => input.value,
      (val) => {
        if (mirrorEl) mirrorEl.textContent = val;
      }
    );

    input.addEventListener('input', () => {
      binder.update();
    });

    // Add action handler
    const handleAdd = () => {
      const text = input.value.trim();
      if (!text) return;
      this.store.dispatch({
        type: 'ADD_TODO',
        payload: { id: Date.now(), text, done: false }
      });
      input.value = '';
      binder.update();
      this.logger.info(`[Store] Dispatched ADD_TODO: "${text}"`);
    };

    addBtn.addEventListener('click', handleAdd);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAdd();
    });

    // Todo List Container
    const listCard = createElement('div', {
      className: 'rounded-xl border overflow-hidden',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const listHeader = createElement('div', {
      className: 'px-5 py-3 border-b flex items-center justify-between text-xs font-semibold',
      style: { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
    }, [
      createElement('span', {}, 'TASK LIST'),
      createElement('span', { id: 'todo-count-badge' }, `${this.store.getState().todos.length} Items`)
    ]);

    const todoList = createElement('ul', {
      id: 'todo-items-list',
      className: 'divide-y divide-slate-700/30'
    });

    listCard.appendChild(listHeader);
    listCard.appendChild(todoList);

    // Render list items function
    const renderItems = (todos) => {
      todoList.innerHTML = '';
      const countBadge = listCard.querySelector('#todo-count-badge');
      if (countBadge) countBadge.textContent = `${todos.length} Items (${todos.filter(t => t.done).length} completed)`;

      if (todos.length === 0) {
        todoList.appendChild(
          createElement('li', {
            className: 'p-8 text-center text-sm',
            style: { color: 'var(--text-secondary)' }
          }, '🎉 All tasks completed! Add a new task above.')
        );
        return;
      }

      todos.forEach(todo => {
        const item = createElement('li', {
          className: 'px-5 py-3.5 flex items-center justify-between hover:bg-slate-800/20 transition-colors'
        }, [
          createElement('div', {
            className: 'flex items-center gap-3 cursor-pointer flex-1',
            onclick: () => {
              this.store.dispatch({ type: 'TOGGLE_TODO', payload: todo.id });
            }
          }, [
            createElement('button', {
              className: `w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-all border ${
                todo.done ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-500 text-transparent'
              }`
            }, '✓'),
            createElement('span', {
              className: `text-sm select-none ${todo.done ? 'line-through opacity-50' : 'font-medium'}`
            }, todo.text)
          ]),
          createElement('button', {
            className: 'p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors',
            title: 'Delete Todo',
            onclick: () => {
              this.store.dispatch({ type: 'REMOVE_TODO', payload: todo.id });
              this.logger.info(`[Store] Dispatched REMOVE_TODO id=${todo.id}`);
            }
          }, '🗑️')
        ]);
        todoList.appendChild(item);
      });
    };

    // Initial render
    renderItems(this.store.getState().todos);

    // Subscribe to store updates
    const unsubscribe = this.store.subscribe(s => s.todos, (todos) => {
      renderItems(todos);
    });

    container.appendChild(header);
    container.appendChild(liveSyncBanner);
    container.appendChild(formCard);
    container.appendChild(listCard);
    main.appendChild(container);
  }

  // ==========================================
  // PAGE 3: STATEMANAGER LAB (TIME TRAVEL)
  // ==========================================
  renderStateLab() {
    const main = querySelector('#main-view');
    if (!main) return;
    main.innerHTML = '';

    const container = createElement('div', { className: 'space-y-6 max-w-5xl mx-auto' });

    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-2xl md:text-3xl font-bold' }, '🔄 StateManager & Time-Travel Lab'),
      createElement('p', { className: 'text-sm', style: { color: 'var(--text-secondary)' } },
        'Live deep-path mutation engine with automatic state snapshots and full Undo / Redo history rollback.'
      )
    ]);

    // Top Controls (Undo, Redo, Reset)
    const controls = createElement('div', {
      className: 'p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const btnGroup = createElement('div', { className: 'flex items-center gap-2' });

    const undoBtn = createElement('button', {
      id: 'undo-btn',
      className: 'px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs flex items-center gap-1.5 transition-all',
      onclick: () => {
        if (this.stateManager.canUndo) {
          this.stateManager.undo();
          this.updateStateView();
          this.logger.info('[StateManager] Undo action executed');
        }
      }
    }, '↶ Undo');

    const redoBtn = createElement('button', {
      id: 'redo-btn',
      className: 'px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs flex items-center gap-1.5 transition-all',
      onclick: () => {
        if (this.stateManager.canRedo) {
          this.stateManager.redo();
          this.updateStateView();
          this.logger.info('[StateManager] Redo action executed');
        }
      }
    }, '↷ Redo');

    const resetBtn = createElement('button', {
      className: 'px-4 py-2 rounded-lg border text-rose-400 border-rose-500/30 hover:bg-rose-500/10 font-medium text-xs transition-all',
      onclick: () => {
        this.stateManager.reset({
          user: { profile: { username: 'default_user', tier: 'free' } }
        });
        this.updateStateView();
        this.logger.warn('[StateManager] State reset to baseline');
      }
    }, 'Reset State');

    btnGroup.appendChild(undoBtn);
    btnGroup.appendChild(redoBtn);
    btnGroup.appendChild(resetBtn);

    const historyStatus = createElement('div', {
      id: 'history-status',
      className: 'text-xs font-mono',
      style: { color: 'var(--text-secondary)' }
    }, `History Stack: ${this.stateManager.history.length} snapshots | Future: ${this.stateManager.future.length}`);

    controls.appendChild(btnGroup);
    controls.appendChild(historyStatus);

    // Interactive Mutator Form
    const mutatorCard = createElement('div', {
      className: 'p-5 rounded-xl border space-y-4',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('h3', { className: 'text-base font-bold' }, 'Mutate State via Deep Path:'),
      createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-3 gap-3' }, [
        createElement('input', {
          id: 'state-path-input',
          type: 'text',
          value: 'user.profile.tier',
          placeholder: 'Path (e.g. user.profile.tier)',
          className: 'px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
          style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
        }),
        createElement('input', {
          id: 'state-val-input',
          type: 'text',
          value: 'platinum_vip',
          placeholder: 'New Value',
          className: 'px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
          style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
        }),
        createElement('button', {
          className: 'px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-sm',
          onclick: () => {
            const p = querySelector('#state-path-input')?.value;
            const v = querySelector('#state-val-input')?.value;
            if (p) {
              this.stateManager.set(p, v);
              this.updateStateView();
              this.logger.info(`[StateManager] Mutated ${p} -> "${v}"`);
            }
          }
        }, 'Apply Mutation (set)')
      ])
    ]);

    // Live State Inspector Code Box
    const viewerCard = createElement('div', {
      className: 'p-5 rounded-xl border space-y-2',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('div', { className: 'flex items-center justify-between' }, [
        createElement('h3', { className: 'text-sm font-bold font-mono text-indigo-400' }, 'CURRENT STATE TREE (JSON)'),
        createElement('span', { className: 'text-xs text-slate-400' }, 'Live Read via stateManager.get()')
      ]),
      createElement('pre', {
        id: 'state-tree-viewer',
        className: 'p-4 rounded-lg bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed'
      }, JSON.stringify(this.stateManager.get(), null, 2))
    ]);

    container.appendChild(header);
    container.appendChild(controls);
    container.appendChild(mutatorCard);
    container.appendChild(viewerCard);
    main.appendChild(container);

    this.updateStateView();
  }

  updateStateView() {
    const viewer = querySelector('#state-tree-viewer');
    if (viewer) {
      viewer.textContent = JSON.stringify(this.stateManager.get(), null, 2);
    }

    const undoBtn = querySelector('#undo-btn');
    const redoBtn = querySelector('#redo-btn');
    const status = querySelector('#history-status');

    if (undoBtn) undoBtn.disabled = !this.stateManager.canUndo;
    if (redoBtn) redoBtn.disabled = !this.stateManager.canRedo;
    if (status) {
      status.textContent = `History Stack: ${this.stateManager.history.length} snapshots | Future: ${this.stateManager.future.length}`;
    }
  }

  // ==========================================
  // PAGE 4: CACHEMANAGER LAB
  // ==========================================
  renderCacheLab() {
    const main = querySelector('#main-view');
    if (!main) return;
    main.innerHTML = '';

    const container = createElement('div', { className: 'space-y-6 max-w-5xl mx-auto' });

    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-2xl md:text-3xl font-bold' }, '💾 CacheManager Lab'),
      createElement('p', { className: 'text-sm', style: { color: 'var(--text-secondary)' } },
        'Advanced in-memory cache system with TTL expiration, Hit-Rate estimation, and LRU / LFU / FIFO eviction strategies.'
      )
    ]);

    // Cache Stats Bar
    const stats = this.cache.stats();
    const statsBar = createElement('div', {
      className: 'grid grid-cols-2 sm:grid-cols-4 gap-4'
    }, [
      this.createStatBox('Active Entries', `${this.cache.size()} / ${this.cache.maxSize}`, '💾'),
      this.createStatBox('Eviction Strategy', this.cache.strategy.toUpperCase(), '⚙️'),
      this.createStatBox('Default TTL', '60 Seconds', '⏱️'),
      this.createStatBox('Estimated Hit Rate', `${(stats.hitRate * 100).toFixed(0)}%`, '📈')
    ]);

    // Add Cache Item Form
    const formCard = createElement('div', {
      className: 'p-5 rounded-xl border space-y-4',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('h3', { className: 'text-base font-bold' }, 'Store Entry to Cache:'),
      createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-3 gap-3' }, [
        createElement('input', {
          id: 'cache-key-input',
          type: 'text',
          placeholder: 'Key (e.g. user:123)',
          className: 'px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
          style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
        }),
        createElement('input', {
          id: 'cache-val-input',
          type: 'text',
          placeholder: 'Value (string/JSON)',
          className: 'px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
          style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
        }),
        createElement('button', {
          className: 'px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all',
          onclick: () => {
            const k = querySelector('#cache-key-input')?.value;
            const v = querySelector('#cache-val-input')?.value;
            if (k && v) {
              this.cache.set(k, v);
              this.renderCacheLab();
              this.logger.info(`[Cache] Set "${k}" -> "${v}"`);
            }
          }
        }, '+ Cache Entry (set)')
      ]),
      createElement('div', { className: 'flex gap-2 pt-2' }, [
        createElement('button', {
          className: 'px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-slate-800 transition-all',
          style: { borderColor: 'var(--border-color)' },
          onclick: () => {
            const expired = this.cache.prune();
            this.renderCacheLab();
            this.logger.info(`[Cache] Pruned ${expired.length} expired entries`);
          }
        }, '🧹 Prune Expired Items'),
        createElement('button', {
          className: 'px-3 py-1.5 rounded-lg border text-xs font-medium text-rose-400 border-rose-500/30 hover:bg-rose-500/10 transition-all',
          onclick: () => {
            this.cache.clear();
            this.renderCacheLab();
            this.logger.warn('[Cache] Cleared all cache entries');
          }
        }, 'Clear All')
      ])
    ]);

    // Active Cache Table
    const tableCard = createElement('div', {
      className: 'rounded-xl border overflow-hidden',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const table = createElement('table', { className: 'w-full text-left text-xs border-collapse' });
    const thead = createElement('thead', {
      className: 'border-b font-mono text-slate-400',
      style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }
    }, [
      createElement('tr', {}, [
        createElement('th', { className: 'p-3' }, 'KEY'),
        createElement('th', { className: 'p-3' }, 'VALUE'),
        createElement('th', { className: 'p-3 text-right' }, 'ACTIONS')
      ])
    ]);

    const tbody = createElement('tbody', { className: 'divide-y divide-slate-700/30 font-mono' });
    const entries = this.cache.entries();

    if (entries.length === 0) {
      tbody.appendChild(
        createElement('tr', {}, [
          createElement('td', { colSpan: 3, className: 'p-6 text-center text-slate-400 font-sans' }, 'Cache is currently empty')
        ])
      );
    } else {
      entries.forEach(([key, val]) => {
        const tr = createElement('tr', { className: 'hover:bg-slate-800/20' }, [
          createElement('td', { className: 'p-3 font-bold text-indigo-400' }, key),
          createElement('td', { className: 'p-3 text-emerald-400 truncate max-w-xs' }, typeof val === 'object' ? JSON.stringify(val) : String(val)),
          createElement('td', { className: 'p-3 text-right' }, [
            createElement('button', {
              className: 'text-rose-400 hover:text-rose-300 p-1',
              onclick: () => {
                this.cache.delete(key);
                this.renderCacheLab();
                this.logger.info(`[Cache] Deleted key "${key}"`);
              }
            }, 'Delete')
          ])
        ]);
        tbody.appendChild(tr);
      });
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    tableCard.appendChild(table);

    container.appendChild(header);
    container.appendChild(statsBar);
    container.appendChild(formCard);
    container.appendChild(tableCard);
    main.appendChild(container);
  }

  createStatBox(label, value, icon) {
    return createElement('div', {
      className: 'p-4 rounded-xl border flex items-center gap-3',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('span', { className: 'text-2xl' }, icon),
      createElement('div', {}, [
        createElement('div', { className: 'text-xs text-slate-400' }, label),
        createElement('div', { className: 'text-lg font-bold font-mono text-indigo-400' }, value)
      ])
    ]);
  }

  // ==========================================
  // PAGE 5: BROWSER DIAGNOSTICS LAB
  // ==========================================
  renderBrowserLab() {
    const main = querySelector('#main-view');
    if (!main) return;
    main.innerHTML = '';

    const container = createElement('div', { className: 'space-y-6 max-w-5xl mx-auto' });

    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-2xl md:text-3xl font-bold' }, '🌐 Browser & Engine Diagnostics'),
      createElement('p', { className: 'text-sm', style: { color: 'var(--text-secondary)' } },
        'Hardware and engine detection results computed at runtime via Browser.js flags.'
      )
    ]);

    const result = getDetectionResult();
    const flatFlags = getFlatFlags();

    // UserAgent Card
    const uaCard = createElement('div', {
      className: 'p-5 rounded-xl border space-y-2',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('div', { className: 'text-xs font-mono text-indigo-400 font-bold' }, 'RAW NAVIGATOR IDENTITY'),
      createElement('div', { className: 'p-3 rounded-lg bg-slate-950 text-slate-300 font-mono text-xs break-all border border-slate-800' }, result.userAgent),
      createElement('div', { className: 'text-xs text-slate-400 flex items-center gap-2 pt-1' }, [
        createElement('span', {}, 'Reported Platform:'),
        createElement('span', { className: 'font-mono text-emerald-400' }, result.platform)
      ])
    ]);

    // Flags Breakdown Grid
    const flagSections = [
      { title: 'Rendering Engine', data: result.flags.engine, icon: '⚙️' },
      { title: 'Browser Client', data: result.flags.browser, icon: '🌍' },
      { title: 'Operating System & Platform', data: result.flags.platform, icon: '💻' },
      { title: 'Hardware & Key Features', data: result.flags.features, icon: '⚡' }
    ];

    const flagGrid = createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-5' });

    flagSections.forEach(section => {
      const card = createElement('div', {
        className: 'p-5 rounded-xl border space-y-3',
        style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
      }, [
        createElement('div', { className: 'flex items-center gap-2 font-bold text-sm' }, [
          createElement('span', {}, section.icon),
          createElement('span', {}, section.title)
        ]),
        createElement('div', { className: 'space-y-1.5 font-mono text-xs divide-y divide-slate-800/50' },
          Object.entries(section.data).map(([key, val]) => {
            const isPositive = Boolean(val);
            return createElement('div', { className: 'flex items-center justify-between py-1.5' }, [
              createElement('span', { className: 'text-slate-400' }, key),
              createElement('span', {
                className: `px-2 py-0.5 rounded text-[11px] font-bold ${
                  isPositive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-500'
                }`
              }, String(val))
            ]);
          })
        )
      ]);
      flagGrid.appendChild(card);
    });

    container.appendChild(header);
    container.appendChild(uaCard);
    container.appendChild(flagGrid);
    main.appendChild(container);
  }

  // ==========================================
  // PAGE 6: STRINGSTREAM & OPERATIONGROUP LAB
  // ==========================================
  renderStreamLab() {
    const main = querySelector('#main-view');
    if (!main) return;
    main.innerHTML = '';

    const container = createElement('div', { className: 'space-y-6 max-w-5xl mx-auto' });

    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-2xl md:text-3xl font-bold' }, '🌊 StringStream & OperationGroup'),
      createElement('p', { className: 'text-sm', style: { color: 'var(--text-secondary)' } },
        'Test in-memory streaming pipelines, transformation chains, and atomic operation transactions.'
      )
    ]);

    // Stream Lab Card
    const streamCard = createElement('div', {
      className: 'p-5 rounded-xl border space-y-4',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const stream = new StringStream();
    const outputConsole = createElement('div', {
      id: 'stream-console',
      className: 'p-4 rounded-lg bg-slate-950 font-mono text-xs text-cyan-400 h-36 overflow-y-auto border border-slate-800 space-y-1'
    });

    stream.on('data', (chunk) => {
      const line = createElement('div', {}, `[STREAM WRITE] >> "${chunk}" (Buffer Length: ${stream.length})`);
      outputConsole.appendChild(line);
      outputConsole.scrollTop = outputConsole.scrollHeight;
    });

    stream.on('read', (data) => {
      const line = createElement('div', { className: 'text-emerald-400 font-bold' }, `[STREAM READ] << "${data}"`);
      outputConsole.appendChild(line);
      outputConsole.scrollTop = outputConsole.scrollHeight;
    });

    const streamControls = createElement('div', { className: 'flex flex-wrap gap-2' }, [
      createElement('button', {
        className: 'px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs',
        onclick: () => {
          const chunk = `Packet_${randomId(4)} `;
          stream.write(chunk);
        }
      }, 'Write Random Chunk'),
      createElement('button', {
        className: 'px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs',
        onclick: () => {
          stream.read(8);
        }
      }, 'Read 8 Bytes'),
      createElement('button', {
        className: 'px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs',
        onclick: () => {
          stream.readAll();
        }
      }, 'Read Entire Buffer'),
      createElement('button', {
        className: 'px-3 py-2 rounded-lg border text-xs font-medium hover:bg-slate-800',
        style: { borderColor: 'var(--border-color)' },
        onclick: () => {
          stream.transform(text => text.toUpperCase());
        }
      }, 'Transform -> UPPERCASE'),
      createElement('button', {
        className: 'px-3 py-2 rounded-lg border text-rose-400 border-rose-500/30 hover:bg-rose-500/10 text-xs font-medium',
        onclick: () => {
          stream.clear();
          outputConsole.innerHTML = '<div class="text-slate-500">Stream buffer cleared.</div>';
        }
      }, 'Clear Stream')
    ]);

    streamCard.appendChild(createElement('h3', { className: 'font-bold text-base' }, '1. Interactive StringStream Pipeline:'));
    streamCard.appendChild(streamControls);
    streamCard.appendChild(outputConsole);

    // OperationGroup Transaction Lab
    const opCard = createElement('div', {
      className: 'p-5 rounded-xl border space-y-4',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const opGroup = new OperationGroup({ name: 'UserTransactionGroup' });
    let balance = 1000;

    const balanceDisplay = createElement('div', { className: 'text-sm font-mono flex items-center gap-2' }, [
      createElement('span', { className: 'text-slate-400' }, 'Current Transaction Balance:'),
      createElement('span', { id: 'balance-val', className: 'text-emerald-400 font-bold text-lg' }, `$${balance}`)
    ]);

    const updateBalanceUI = () => {
      const bEl = querySelector('#balance-val');
      if (bEl) bEl.textContent = `$${balance}`;
    };

    const opControls = createElement('div', { className: 'flex flex-wrap gap-2' }, [
      createElement('button', {
        className: 'px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium',
        onclick: () => {
          const depositAmount = 250;
          opGroup.addOperation({
            name: `Deposit +$${depositAmount}`,
            execute: () => { balance += depositAmount; updateBalanceUI(); return depositAmount; },
            undo: (result) => { balance -= result; updateBalanceUI(); }
          });
          opGroup.execute();
          this.logger.info(`[OperationGroup] Executed deposit: +$${depositAmount}`);
        }
      }, '+ Deposit $250'),
      createElement('button', {
        className: 'px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium',
        onclick: () => {
          const withdrawAmount = 100;
          opGroup.addOperation({
            name: `Withdraw -$${withdrawAmount}`,
            execute: () => { balance -= withdrawAmount; updateBalanceUI(); return withdrawAmount; },
            undo: (result) => { balance += result; updateBalanceUI(); }
          });
          opGroup.execute();
          this.logger.info(`[OperationGroup] Executed withdrawal: -$${withdrawAmount}`);
        }
      }, '- Withdraw $100'),
      createElement('button', {
        className: 'px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium',
        onclick: () => {
          opGroup.undo();
          this.logger.info('[OperationGroup] Rolled back last operation');
        }
      }, '↶ Undo Transaction')
    ]);

    opCard.appendChild(createElement('h3', { className: 'font-bold text-base' }, '2. OperationGroup Transaction Stack:'));
    opCard.appendChild(balanceDisplay);
    opCard.appendChild(opControls);

    container.appendChild(header);
    container.appendChild(streamCard);
    container.appendChild(opCard);
    main.appendChild(container);
  }

  // ==========================================
  // PAGE 7: VALIDATOR LAB
  // ==========================================
  renderValidatorLab() {
    const main = querySelector('#main-view');
    if (!main) return;
    main.innerHTML = '';

    const container = createElement('div', { className: 'space-y-6 max-w-4xl mx-auto' });

    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-2xl md:text-3xl font-bold' }, '🛡️ Validator & Schema Engine'),
      createElement('p', { className: 'text-sm', style: { color: 'var(--text-secondary)' } },
        'Live schema validation testing email, required, min, max, integer, and enum rules.'
      )
    ]);

    const formCard = createElement('div', {
      className: 'p-6 rounded-xl border space-y-4',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const formGrid = createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-4' }, [
      this.createFormField('Username (required, 4-20 chars)', 'val-username', 'vexor_coder'),
      this.createFormField('Email Address (required, valid email)', 'val-email', 'coder@vexorion.io'),
      this.createFormField('Age (integer, 18-120)', 'val-age', '28'),
      this.createFormField('Role (developer, designer, manager, architect)', 'val-role', 'architect')
    ]);

    const resultBox = createElement('div', {
      id: 'val-result-box',
      className: 'p-4 rounded-lg bg-slate-950 font-mono text-xs border border-slate-800'
    }, 'Fill form and click Validate below.');

    const validateBtn = createElement('button', {
      className: 'px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-sm',
      onclick: () => {
        const payload = {
          username: querySelector('#val-username')?.value,
          email: querySelector('#val-email')?.value,
          age: querySelector('#val-age')?.value,
          role: querySelector('#val-role')?.value
        };

        const { isValid, errors } = this.validator.validateSchema(payload, 'userProfile');
        const box = querySelector('#val-result-box');
        if (box) {
          if (isValid) {
            box.className = 'p-4 rounded-lg bg-emerald-950/40 text-emerald-400 font-mono text-xs border border-emerald-800/50';
            box.textContent = `✅ Validation SUCCESS! All rules passed:\n${JSON.stringify(payload, null, 2)}`;
          } else {
            box.className = 'p-4 rounded-lg bg-rose-950/40 text-rose-400 font-mono text-xs border border-rose-800/50';
            box.textContent = `❌ Validation FAILED with errors:\n${JSON.stringify(errors, null, 2)}`;
          }
        }
      }
    }, 'Test Validate Schema');

    formCard.appendChild(formGrid);
    formCard.appendChild(validateBtn);
    formCard.appendChild(resultBox);

    container.appendChild(header);
    container.appendChild(formCard);
    main.appendChild(container);
  }

  createFormField(label, id, defaultValue) {
    return createElement('div', { className: 'space-y-1.5' }, [
      createElement('label', { className: 'text-xs font-semibold text-slate-300' }, label),
      createElement('input', {
        id,
        type: 'text',
        value: defaultValue,
        className: 'w-full px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
        style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
      })
    ]);
  }

  // ==========================================
  // PAGE 8: LIVE LOGGER TERMINAL
  // ==========================================
  renderLoggerLab() {
    const main = querySelector('#main-view');
    if (!main) return;
    main.innerHTML = '';

    const container = createElement('div', { className: 'space-y-6 max-w-5xl mx-auto' });

    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-2xl md:text-3xl font-bold' }, '📋 Live Logger Terminal'),
      createElement('p', { className: 'text-sm', style: { color: 'var(--text-secondary)' } },
        'Logger.js event stream capturing levels: debug, info, warn, error, and fatal.'
      )
    ]);

    const terminalCard = createElement('div', {
      className: 'rounded-xl border overflow-hidden',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const termHeader = createElement('div', {
      className: 'px-4 py-3 border-b flex items-center justify-between',
      style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }
    }, [
      createElement('div', { className: 'flex items-center gap-2' }, [
        createElement('span', { className: 'w-3 h-3 rounded-full bg-rose-500' }),
        createElement('span', { className: 'w-3 h-3 rounded-full bg-amber-500' }),
        createElement('span', { className: 'w-3 h-3 rounded-full bg-emerald-500' }),
        createElement('span', { className: 'text-xs font-mono font-bold text-slate-300 pl-2' }, 'Vexorion Logger Console')
      ]),
      createElement('button', {
        className: 'text-xs text-slate-400 hover:text-white',
        onclick: () => {
          const body = querySelector('#live-log-container');
          if (body) body.innerHTML = '';
        }
      }, 'Clear Console')
    ]);

    const logBody = createElement('div', {
      id: 'live-log-container',
      className: 'p-4 bg-slate-950 font-mono text-xs h-72 overflow-y-auto space-y-1'
    });

    // Add DOM transport to logger
    this.logger.addTransport({
      type: 'live-ui',
      handler: (entry) => {
        const body = querySelector('#live-log-container');
        if (!body) return;
        const colorClass =
          entry.level === 'error' || entry.level === 'fatal' ? 'text-rose-400' :
          entry.level === 'warn' ? 'text-amber-400' :
          entry.level === 'debug' ? 'text-cyan-400' : 'text-slate-300';

        const line = createElement('div', { className: colorClass }, entry.formatted);
        body.appendChild(line);
        body.scrollTop = body.scrollHeight;
      }
    });

    const triggerControls = createElement('div', { className: 'p-4 border-t flex flex-wrap gap-2', style: { borderColor: 'var(--border-color)' } }, [
      createElement('button', {
        className: 'px-3 py-1.5 rounded bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 text-xs font-medium',
        onclick: () => this.logger.debug('Debug trace packet received', { latency: '12ms' })
      }, '+ Log Debug'),
      createElement('button', {
        className: 'px-3 py-1.5 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-medium',
        onclick: () => this.logger.info('System status is nominal', { healthy: true })
      }, '+ Log Info'),
      createElement('button', {
        className: 'px-3 py-1.5 rounded bg-amber-600/20 text-amber-400 border border-amber-500/30 text-xs font-medium',
        onclick: () => this.logger.warn('High memory usage threshold warning (78%)')
      }, '+ Log Warn'),
      createElement('button', {
        className: 'px-3 py-1.5 rounded bg-rose-600/20 text-rose-400 border border-rose-500/30 text-xs font-medium',
        onclick: () => this.logger.error('Simulated sample error: Network socket retry limit reached', { retryCount: 3 })
      }, '+ Log Error')
    ]);

    terminalCard.appendChild(termHeader);
    terminalCard.appendChild(logBody);
    terminalCard.appendChild(triggerControls);

    container.appendChild(header);
    container.appendChild(terminalCard);
    main.appendChild(container);

    // Initial logs
    this.logger.info('Logger console initialized and connected');
  }

  // ==========================================
  // PAGE 9: QUICK START SANDBOX
  // ==========================================
  renderQuickStart() {
    const main = querySelector('#main-view');
    if (!main) return;
    main.innerHTML = '';

    const container = createElement('div', { className: 'space-y-6 max-w-5xl mx-auto' });

    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-2xl md:text-3xl font-bold' }, '🚀 Quick Start & Interactive Sandbox'),
      createElement('p', { className: 'text-sm', style: { color: 'var(--text-secondary)' } },
        'Test live minimal setup and check code snippets for integrating Vexorion in your apps.'
      )
    ]);

    // Live Counter Interactive Sandbox Box
    const sandboxCard = createElement('div', {
      className: 'p-6 rounded-xl border space-y-4',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('h3', { className: 'text-base font-bold' }, 'Live Interactive Sandbox Counter:'),
      createElement('div', { className: 'flex items-center gap-4' }, [
        createElement('button', {
          id: 'sandbox-inc-btn',
          className: 'px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all',
          onclick: () => {
            this.store.dispatch({ type: 'INCREMENT_COUNTER' });
            const cEl = querySelector('#sandbox-counter-val');
            if (cEl) cEl.textContent = String(this.store.getState().counter);
          }
        }, 'Increment Store Counter'),
        createElement('div', { className: 'flex items-center gap-2 text-sm font-mono' }, [
          createElement('span', { className: 'text-slate-400' }, 'Count:'),
          createElement('span', {
            id: 'sandbox-counter-val',
            className: 'text-2xl font-bold text-emerald-400'
          }, String(this.store.getState().counter))
        ]),
        createElement('button', {
          className: 'px-3 py-1.5 rounded border text-xs font-medium hover:bg-slate-800',
          style: { borderColor: 'var(--border-color)' },
          onclick: () => {
            this.store.dispatch({ type: 'RESET_COUNTER' });
            const cEl = querySelector('#sandbox-counter-val');
            if (cEl) cEl.textContent = '0';
          }
        }, 'Reset')
      ])
    ]);

    // Code Snippet Card
    const codeSnippet = `import {
  querySelector,
  createElement,
  onEvent,
  Store,
  Bidirectional,
  EventEmitter,
  Logger
} from 'vexorion';

// 1. Create Logger & Store
const logger = new Logger({ level: 'info' });
const store = new Store({ initialState: { count: 0 } });

// 2. Build DOM Component
const app = createElement('div', { id: 'app' }, [
  createElement('h1', {}, 'Vexorion App'),
  createElement('button', { id: 'btn' }, 'Increment'),
  createElement('div', { id: 'counter' }, '0')
]);
document.body.appendChild(app);

// 3. Setup Bidirectional Binding
const counter = querySelector('#counter');
const binder = new Bidirectional({ twoWay: true, immediate: true });
binder.bind(() => store.getState().count, (val) => { counter.textContent = val; });

// 4. Handle Actions
store.addReducer('INCREMENT', (state) => ({ ...state, count: state.count + 1 }));
onEvent('#btn', 'click', () => store.dispatch({ type: 'INCREMENT' }));`;

    const codeCard = createElement('div', {
      className: 'p-5 rounded-xl border space-y-2',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('div', { className: 'flex items-center justify-between' }, [
        createElement('span', { className: 'text-xs font-mono font-bold text-indigo-400' }, 'SAMPLE BOOTSTRAP SCRIPT'),
        createElement('span', { className: 'text-xs text-slate-400' }, 'ES Module Syntax')
      ]),
      createElement('pre', {
        className: 'p-4 rounded-lg bg-slate-950 text-indigo-300 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed'
      }, codeSnippet)
    ]);

    container.appendChild(header);
    container.appendChild(sandboxCard);
    container.appendChild(codeCard);
    main.appendChild(container);
  }

  renderNotFound() {
    const main = querySelector('#main-view');
    if (!main) return;
    main.innerHTML = '';

    const notFound = createElement('div', {
      className: 'text-center py-16 space-y-4'
    }, [
      createElement('h2', { className: 'text-4xl font-bold' }, '404 - Page Not Found'),
      createElement('p', { style: { color: 'var(--text-secondary)' } }, 'The requested route does not exist.'),
      createElement('button', {
        className: 'px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium',
        onclick: () => this.router.navigate('/')
      }, 'Return to Overview')
    ]);

    main.appendChild(notFound);
  }
}

// Instantiate and launch Vexorion on page load
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.__VEXORION_APP__ = new VexorionApp();
  });
}

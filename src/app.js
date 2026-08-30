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
  AssetManager,

  // Modes
  DarkMode,
  LightMode,
  AccessibilityMode,
  CompactMode,
  DeveloperMode,

  // Plugins
  PluginSystem,
  Middleware,
  Hooks,

  // Icons & Assets
  Icons,
  ICONS_REGISTRY,
  loadIcon
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

    // Setup AssetManager with visual assets
    this.assets = new AssetManager({
      assets: {
        'logo': {
          url: '/src/assets/images/vexorion_logo_1788081398062.jpg',
          alt: 'Vexorion Official Framework Logo',
          title: 'Vexorion Logo',
          type: 'image',
          tags: ['branding', 'logo', 'identity']
        },
        'hero_banner': {
          url: '/src/assets/images/vexorion_hero_banner_1788081416448.jpg',
          alt: 'Vexorion Architecture and Runtime Ecosystem',
          title: 'Architecture Visualization',
          type: 'image',
          tags: ['hero', 'banner', 'architecture']
        },
        'architect_avatar': {
          url: '/src/assets/images/developer_avatar_1788081430918.jpg',
          alt: 'Vexorion Core Architect Portrait',
          title: 'Lead Architect Avatar',
          type: 'image',
          tags: ['user', 'profile', 'avatar']
        }
      }
    });

    // Register all 65 individual icons into the AssetManager
    ICONS_REGISTRY.forEach(icon => {
      this.assets.register(icon.name, `/src/assets/icons/${icon.name}.svg`, {
        title: icon.label,
        alt: `${icon.name} - ${icon.label}`,
        type: 'image',
        tags: ['icon', icon.category.toLowerCase().replace(/\s+/g, '-'), `id-${icon.id}`],
        iconId: icon.id,
        category: icon.category
      });
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
      .addRoute('/assets', () => this.renderAssetLab())
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
    const logoImg = createElement('img', {
      src: this.assets.getUrl('logo') || '/src/assets/images/vexorion_logo_1788081398062.jpg',
      alt: 'Vexorion Framework Official Logo',
      className: 'w-9 h-9 rounded-lg object-cover shadow-md border border-indigo-500/30'
    });
    logoImg.referrerPolicy = 'no-referrer';

    const brand = createElement('div', {
      className: 'flex items-center space-x-3 cursor-pointer select-none',
      onclick: () => this.router.navigate('/')
    }, [
      logoImg,
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
      className: 'hidden lg:flex items-center space-x-1 font-medium text-sm'
    });

    const routes = [
      { path: '/', label: 'Overview', icon: '⚡' },
      { path: '/todos', label: 'Todo & Binding', icon: '📝' },
      { path: '/state', label: 'StateManager', icon: '🔄' },
      { path: '/cache', label: 'Cache System', icon: '💾' },
      { path: '/assets', label: 'Media & Assets', icon: '🖼️' },
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

    // Right Controls: Mode Switcher & Profile Avatar
    const rightControls = createElement('div', { className: 'flex items-center gap-3' });

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

    // Profile Avatar Button
    const avatarImg = createElement('img', {
      src: this.assets.getUrl('architect_avatar') || '/src/assets/images/developer_avatar_1788081430918.jpg',
      alt: 'Architect Profile Avatar',
      className: 'w-8 h-8 rounded-full object-cover border-2 border-indigo-500/40 shadow-sm hover:scale-105 transition-transform cursor-pointer',
      title: 'Architect Profile (State & Media)',
      onclick: () => this.router.navigate('/assets')
    });
    avatarImg.referrerPolicy = 'no-referrer';

    rightControls.appendChild(modeSwitcher);
    rightControls.appendChild(avatarImg);

    header.appendChild(brand);
    header.appendChild(nav);
    header.appendChild(rightControls);

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

    // Hero Banner with Visual Asset
    const heroBgImg = createElement('img', {
      src: this.assets.getUrl('hero_banner') || '/src/assets/images/vexorion_hero_banner_1788081416448.jpg',
      alt: 'Vexorion Core Architecture Ecosystem Banner',
      className: 'absolute inset-0 w-full h-full object-cover opacity-20 filter blur-[1px]'
    });
    heroBgImg.referrerPolicy = 'no-referrer';

    const hero = createElement('div', {
      className: 'rounded-2xl p-6 md:p-10 border relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8',
      style: {
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)'
      }
    }, [
      heroBgImg,
      createElement('div', { className: 'max-w-2xl space-y-4 relative z-10' }, [
        createElement('div', { className: 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' }, [
          createElement('span', { className: 'w-2 h-2 rounded-full bg-indigo-400' }),
          createElement('span', {}, 'Autonomous JavaScript Architecture')
        ]),
        createElement('h1', { className: 'text-3xl md:text-5xl font-black tracking-tight' }, 'The Vexorion Ecosystem'),
        createElement('p', { className: 'text-base md:text-lg leading-relaxed', style: { color: 'var(--text-secondary)' } },
          'A handcrafted, modular JavaScript engine providing core hardware & engine detection, reactive event emitters, bidirectional bindings, state history tracking, high-efficiency caching, asset pipelines, and multi-mode theme systems.'
        ),
        createElement('div', { className: 'flex flex-wrap gap-3 pt-2' }, [
          createElement('button', {
            className: 'px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md flex items-center gap-2',
            onclick: () => this.router.navigate('/todos')
          }, '🚀 Launch Interactive Todo Lab'),
          createElement('button', {
            className: 'px-5 py-2.5 rounded-lg border font-medium text-sm transition-all hover:bg-slate-800/50 flex items-center gap-2',
            style: { borderColor: 'var(--border-color)' },
            onclick: () => this.router.navigate('/assets')
          }, '🖼️ Explore Media & Assets'),
          createElement('button', {
            className: 'px-5 py-2.5 rounded-lg border font-medium text-sm transition-all hover:bg-slate-800/50 flex items-center gap-2',
            style: { borderColor: 'var(--border-color)' },
            onclick: () => this.router.navigate('/quickstart')
          }, '📖 Quick Start & Sandbox')
        ])
      ]),
      createElement('div', { className: 'relative z-10 w-full md:w-80 rounded-xl overflow-hidden border shadow-xl border-indigo-500/30 group' }, [
        createElement('img', {
          src: this.assets.getUrl('hero_banner') || '/src/assets/images/vexorion_hero_banner_1788081416448.jpg',
          alt: 'Vexorion Visual Architecture Architecture Preview',
          className: 'w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300',
          loading: 'eager'
        }),
        createElement('div', {
          className: 'p-3 text-xs flex items-center justify-between border-t',
          style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }
        }, [
          createElement('span', { className: 'font-mono text-indigo-400 font-semibold' }, 'Architecture Visualizer'),
          createElement('span', { className: 'text-emerald-400 font-mono text-[11px]' }, '● Live Ecosystem')
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
        title: 'Asset & Media Manager',
        desc: 'Preloading pipeline, memory image cache, resolution detection, metadata registry, and direct rendering.',
        icon: '🖼️',
        badge: 'AssetManager.js',
        action: () => this.router.navigate('/assets')
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

  // ==========================================
  // PAGE: ASSET & MEDIA MANAGER LAB
  // ==========================================
  renderAssetLab() {
    const main = querySelector('#main-view');
    if (!main) return;
    main.innerHTML = '';

    const container = createElement('div', { className: 'space-y-6 max-w-6xl mx-auto animate-fade-in' });

    // Header
    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-2xl md:text-3xl font-bold' }, '🖼️ AssetManager & Media Pipeline Lab'),
      createElement('p', { className: 'text-sm', style: { color: 'var(--text-secondary)' } },
        'Reactive media registry, automatic image preloading, resolution inspection, DOM element generators, and zero-latency in-memory cache.'
      )
    ]);

    // Live Metrics Bar
    const statsBar = createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-4 gap-4' }, [
      this.createStatBox('Total Registered', this.assets.count, '📦'),
      this.createStatBox('Cached In Memory', this.assets.cache.size, '⚡'),
      this.createStatBox('Media Types', 'Images, Vectors', '🎨'),
      this.createStatBox('Pipeline State', 'Active & Ready', '🚀')
    ]);

    // Preload & Actions Card
    const actionsCard = createElement('div', {
      className: 'p-5 rounded-xl border flex flex-wrap items-center justify-between gap-4',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const actionButtons = createElement('div', { className: 'flex flex-wrap items-center gap-3' });

    const preloadBtn = createElement('button', {
      id: 'preload-all-btn',
      className: 'px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 transition-all shadow-md',
      onclick: async () => {
        const btn = querySelector('#preload-all-btn');
        if (btn) btn.textContent = '⏳ Preloading Assets...';
        try {
          const results = await this.assets.preloadAll();
          this.logger.info(`[AssetManager] Successfully preloaded ${results.length} assets`);
          this.renderAssetLab();
        } catch (err) {
          this.logger.error(`[AssetManager] Preload error: ${err.message}`);
        }
      }
    }, '⚡ Preload All Assets to Memory');

    const clearCacheBtn = createElement('button', {
      className: 'px-4 py-2.5 rounded-lg border text-rose-400 border-rose-500/30 hover:bg-rose-500/10 font-medium text-xs transition-all',
      onclick: () => {
        this.assets.clearCache();
        this.logger.warn('[AssetManager] Cleared asset memory cache');
        this.renderAssetLab();
      }
    }, '🧹 Clear Asset Cache');

    actionButtons.appendChild(preloadBtn);
    actionButtons.appendChild(clearCacheBtn);

    const assetEngineInfo = createElement('div', {
      className: 'text-xs font-mono text-slate-400 flex items-center gap-2'
    }, [
      createElement('span', { className: 'w-2 h-2 rounded-full bg-emerald-400' }),
      createElement('span', {}, 'Engine: classes/AssetManager.js')
    ]);

    actionsCard.appendChild(actionButtons);
    actionsCard.appendChild(assetEngineInfo);

    // Interactive Register Asset Form
    const registerCard = createElement('div', {
      className: 'p-5 rounded-xl border space-y-4',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('div', { className: 'flex items-center justify-between' }, [
        createElement('h3', { className: 'text-base font-bold' }, 'Register New Asset to Pipeline:'),
        createElement('span', { className: 'text-xs font-mono text-indigo-400' }, 'assets.register(key, options)')
      ]),
      createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3' }, [
        createElement('input', {
          id: 'new-asset-key',
          type: 'text',
          placeholder: 'Asset Key (e.g. hero_mockup)',
          className: 'px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
          style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
        }),
        createElement('input', {
          id: 'new-asset-url',
          type: 'text',
          placeholder: 'URL or Path (/src/assets/...)',
          className: 'px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
          style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
        }),
        createElement('input', {
          id: 'new-asset-title',
          type: 'text',
          placeholder: 'Title / Alt Description',
          className: 'px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
          style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
        }),
        createElement('button', {
          className: 'px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-all shadow-sm flex items-center justify-center gap-2',
          onclick: () => {
            const key = querySelector('#new-asset-key')?.value.trim();
            const url = querySelector('#new-asset-url')?.value.trim();
            const title = querySelector('#new-asset-title')?.value.trim() || key;

            if (key && url) {
              this.assets.register(key, {
                url,
                alt: title,
                title,
                type: 'image',
                tags: ['custom', 'user-registered']
              });
              this.logger.info(`[AssetManager] Registered new asset "${key}" -> ${url}`);
              this.renderAssetLab();
            }
          }
        }, '➕ Register Asset')
      ])
    ]);

    // Interactive Filter & Search Bar
    const filterCard = createElement('div', {
      className: 'p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    let currentCategoryFilter = this._assetCategoryFilter || 'all';
    let searchQuery = this._assetSearchQuery || '';

    const categories = [
      { id: 'all', label: 'All Assets & Icons' },
      { id: 'Navigation & Basic UI', label: '🧭 Navigation (15)' },
      { id: 'User & Profile', label: '👤 User (8)' },
      { id: 'Commerce & Data', label: '📦 Commerce & Data (10)' },
      { id: 'Notification & Communication', label: '🔔 Notification (10)' },
      { id: 'File & Document', label: '📁 File & Docs (8)' },
      { id: 'System & Tools', label: '⚙️ System & Tools (10)' },
      { id: 'Media & Social', label: '🎨 Media & Social (5)' },
      { id: 'images', label: '🖼️ Core Media Images' }
    ];

    const categoryChips = createElement('div', { className: 'flex flex-wrap gap-1.5' });
    categories.forEach(cat => {
      const isActive = currentCategoryFilter === cat.id;
      const chip = createElement('button', {
        className: `px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          isActive
            ? 'bg-indigo-600 text-white shadow-sm'
            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
        }`,
        onclick: () => {
          this._assetCategoryFilter = cat.id;
          this.renderAssetLab();
        }
      }, cat.label);
      categoryChips.appendChild(chip);
    });

    const searchInput = createElement('input', {
      id: 'asset-search-input',
      type: 'text',
      value: searchQuery,
      placeholder: '🔍 Search 65 icons & media (e.g. home, search, user, cart, wifi)...',
      className: 'w-full md:w-80 px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
      style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' },
      oninput: (e) => {
        this._assetSearchQuery = e.target.value.toLowerCase().trim();
        this.renderAssetLab();
      }
    });

    filterCard.appendChild(categoryChips);
    filterCard.appendChild(searchInput);

    // Visual Asset Gallery Grid
    const allAssets = this.assets.getAll();
    const filteredAssets = allAssets.filter(asset => {
      const isIcon = asset.tags.includes('icon');
      const cat = asset.metadata?.category || (isIcon ? 'icons' : 'images');
      
      // Category filter
      if (currentCategoryFilter !== 'all') {
        if (currentCategoryFilter === 'images' && isIcon) return false;
        if (currentCategoryFilter !== 'images' && cat !== currentCategoryFilter) return false;
      }

      // Search filter
      if (searchQuery) {
        const matchName = asset.name.toLowerCase().includes(searchQuery);
        const matchTitle = (asset.title || '').toLowerCase().includes(searchQuery);
        const matchAlt = (asset.alt || '').toLowerCase().includes(searchQuery);
        const matchCat = (cat || '').toLowerCase().includes(searchQuery);
        return matchName || matchTitle || matchAlt || matchCat;
      }

      return true;
    });

    const galleryHeading = createElement('div', { className: 'flex items-center justify-between pt-2' }, [
      createElement('h3', { className: 'text-lg font-bold flex items-center gap-2' }, [
        createElement('span', {}, '🖼️'),
        createElement('span', {}, 'Registered Assets & 65-Icon Modular Catalog')
      ]),
      createElement('span', { className: 'text-xs text-slate-400 font-mono' }, `Showing ${filteredAssets.length} of ${this.assets.count} Active Assets`)
    ]);

    const galleryGrid = createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' });

    filteredAssets.forEach(asset => {
      const key = asset.name;
      const isLoaded = this.assets.isLoaded(key);
      const fullUrl = asset.url;
      const isIcon = asset.tags.includes('icon');
      const iconId = asset.metadata?.iconId;

      const card = createElement('div', {
        className: 'rounded-xl border overflow-hidden flex flex-col justify-between group transition-all hover:border-indigo-500/50 shadow-sm p-3 gap-3',
        style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
      });

      // Preview Wrapper
      const previewWrapper = createElement('div', {
        className: `relative w-full ${isIcon ? 'h-24' : 'h-36'} bg-slate-950/80 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800/80 p-3`
      });

      const img = createElement('img', {
        src: fullUrl,
        alt: asset.alt || key,
        className: isIcon
          ? 'w-10 h-10 object-contain filter invert opacity-90 group-hover:scale-110 transition-transform duration-200'
          : 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300',
        loading: 'lazy'
      });
      img.referrerPolicy = 'no-referrer';

      const tagBadge = createElement('div', {
        className: 'absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-mono text-indigo-300 border border-indigo-500/30'
      }, isIcon ? `#${iconId}` : 'IMG');

      const cacheBadge = createElement('div', {
        className: `absolute top-2 right-2 px-1.5 py-0.5 rounded backdrop-blur-md text-[9px] font-mono border ${
          isLoaded
            ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/40'
            : 'bg-slate-900/90 text-slate-400 border-slate-700/40'
        }`
      }, isLoaded ? '● Loaded' : '○ Standby');

      previewWrapper.appendChild(img);
      previewWrapper.appendChild(tagBadge);
      previewWrapper.appendChild(cacheBadge);

      // Metadata Info
      const body = createElement('div', { className: 'space-y-1.5 flex-1 flex flex-col justify-between' }, [
        createElement('div', { className: 'space-y-1' }, [
          createElement('h4', { className: 'font-bold text-xs text-slate-100 group-hover:text-indigo-400 transition-colors truncate' }, asset.title || key),
          createElement('p', { className: 'text-[11px] font-mono text-indigo-300/80 truncate' }, key),
          createElement('p', { className: 'text-[10px] text-slate-400 line-clamp-1' }, asset.metadata?.category || 'Visual Asset')
        ]),
        createElement('div', { className: 'pt-2 border-t flex items-center justify-between gap-1.5', style: { borderColor: 'var(--border-color)' } }, [
          createElement('button', {
            className: 'flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition-all text-center',
            onclick: async () => {
              try {
                await this.assets.load(key);
                this.logger.info(`[AssetManager] Loaded "${key}"`);
                this.renderAssetLab();
              } catch (e) {
                this.logger.error(`[AssetManager] Failed to load "${key}": ${e.message}`);
              }
            }
          }, isLoaded ? '✓ In Memory' : '⚡ Load'),
          createElement('button', {
            className: 'px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 text-[11px] font-mono text-indigo-400 transition-all',
            title: 'Copy import statement / key',
            onclick: (e) => {
              const snippet = isIcon
                ? `import { ${key.replace(/-/g, '_')} } from 'vexorion/icons/${key}.js';`
                : `assets.get('${key}')`;
              if (navigator.clipboard) {
                navigator.clipboard.writeText(snippet);
                e.target.textContent = 'Copied!';
                setTimeout(() => { e.target.textContent = 'Copy'; }, 1500);
              }
            }
          }, 'Copy')
        ])
      ]);

      card.appendChild(previewWrapper);
      card.appendChild(body);
      galleryGrid.appendChild(card);
    });

    if (filteredAssets.length === 0) {
      const emptyState = createElement('div', {
        className: 'col-span-full py-12 text-center text-slate-400 font-mono text-xs border border-dashed rounded-xl',
        style: { borderColor: 'var(--border-color)' }
      }, `No assets or icons found matching category "${currentCategoryFilter}" and query "${searchQuery}".`);
      galleryGrid.appendChild(emptyState);
    }

    // Integration Code Card
    const codeSnippet = `// 1. Initialize AssetManager in your Vexorion application
import { AssetManager } from 'vexorion';

const assets = new AssetManager({
  assets: {
    'logo': { url: '/src/assets/images/vexorion_logo.jpg', alt: 'Vexorion Logo', tags: ['branding'] },
    'hero': { url: '/src/assets/images/hero_banner.jpg', alt: 'Hero Banner', tags: ['hero'] }
  }
});

// 2. Preload assets asynchronously
await assets.preloadAll();

// 3. Create reactive Image DOM elements automatically
const logoElement = assets.createImageElement('logo', {
  className: 'w-10 h-10 rounded-lg shadow-md'
});
document.body.appendChild(logoElement);

// 4. Retrieve cached resolved URL or inspect metadata
const url = assets.getUrl('logo');
const meta = assets.getMeta('logo');`;

    const codeCard = createElement('div', {
      className: 'p-5 rounded-xl border space-y-2',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('div', { className: 'flex items-center justify-between' }, [
        createElement('span', { className: 'text-xs font-mono font-bold text-indigo-400' }, 'ASSETMANAGER INTEGRATION PATTERN'),
        createElement('span', { className: 'text-xs text-slate-400' }, 'ES Module Syntax')
      ]),
      createElement('pre', {
        className: 'p-4 rounded-lg bg-slate-950 text-indigo-300 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed'
      }, codeSnippet)
    ]);

    container.appendChild(header);
    container.appendChild(statsBar);
    container.appendChild(actionsCard);
    container.appendChild(registerCard);
    container.appendChild(galleryHeading);
    container.appendChild(galleryGrid);
    container.appendChild(codeCard);

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

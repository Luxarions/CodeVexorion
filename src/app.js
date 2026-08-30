// ============================================================
//  APP.JS - Vexorion Complete Interactive Modular Application
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

// Modular UI Components
import {
  Navbar,
  Footer,
  OverviewView,
  TodoLabView,
  StateLabView,
  CacheLabView,
  AssetLabView,
  BrowserLabView,
  StreamLabView,
  ValidatorLabView,
  LoggerLabView,
  QuickStartView
} from './components/index.js';

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

    // Setup AssetManager with separated visual assets (Logos, Banners, Avatars)
    this.assets = new AssetManager({
      assets: {
        'logo': {
          url: '/src/assets/images/vexorion_logo_1788081398062.jpg',
          alt: 'Vexorion Official Framework Logo',
          title: 'Vexorion Core Logo',
          type: 'image',
          kind: 'logo',
          category: 'Logo',
          tags: ['branding', 'logo', 'identity']
        },
        'hero_banner': {
          url: '/src/assets/images/vexorion_hero_banner_1788081416448.jpg',
          alt: 'Vexorion Architecture and Runtime Ecosystem',
          title: 'Architecture Visualization',
          type: 'image',
          kind: 'banner',
          category: 'Banner',
          tags: ['hero', 'banner', 'architecture']
        },
        'architect_avatar': {
          url: '/src/assets/images/developer_avatar_1788081430918.jpg',
          alt: 'Vexorion Core Architect Portrait',
          title: 'Lead Architect Avatar',
          type: 'image',
          kind: 'avatar',
          category: 'Avatar',
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
        kind: 'icon',
        tags: ['icon', icon.category.toLowerCase().replace(/\s+/g, '-'), `id-${icon.id}`],
        iconId: icon.id,
        category: icon.category
      });
    });

    // Initialize Component Instances
    this.navbarComponent = new Navbar(this);
    this.footerComponent = new Footer(this);
    this.overviewView = new OverviewView(this);
    this.todoLabView = new TodoLabView(this);
    this.stateLabView = new StateLabView(this);
    this.cacheLabView = new CacheLabView(this);
    this.assetLabView = new AssetLabView(this);
    this.browserLabView = new BrowserLabView(this);
    this.streamLabView = new StreamLabView(this);
    this.validatorLabView = new ValidatorLabView(this);
    this.loggerLabView = new LoggerLabView(this);
    this.quickStartView = new QuickStartView(this);

    // Setup Modes
    this.setupModes();

    // Setup Plugin System
    this.setupPlugins();

    // Setup Router
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

    // Setup Store Reducers
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

    // Shell Container: max-w-full and overflow-x-hidden prevents mobile shifting
    const shell = createElement('div', {
      className: 'min-h-screen flex flex-col transition-colors duration-200 w-full max-w-full min-w-0 overflow-x-hidden'
    });

    // 1. Navigation Header
    const header = this.navbarComponent.render();

    // 2. Mobile Nav Bar
    const mobileNav = this.navbarComponent.renderMobileMenu();

    // 3. Main Content Area
    const main = createElement('main', {
      id: 'main-view',
      className: 'flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8 transition-colors duration-200 min-w-0'
    });

    // 4. Footer
    const footer = this.footerComponent.render();

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

  // View Mounting Handlers
  mountView(viewElement) {
    const main = querySelector('#main-view');
    if (!main) return;
    main.innerHTML = '';
    main.appendChild(viewElement);
    // Smooth scroll to top when changing view
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  renderHome() {
    this.mountView(this.overviewView.render());
  }

  renderTodos() {
    this.mountView(this.todoLabView.render());
  }

  renderStateLab() {
    this.mountView(this.stateLabView.render());
  }

  renderCacheLab() {
    this.mountView(this.cacheLabView.render());
  }

  renderAssetLab() {
    this.mountView(this.assetLabView.render());
  }

  renderBrowserLab() {
    this.mountView(this.browserLabView.render());
  }

  renderStreamLab() {
    this.mountView(this.streamLabView.render());
  }

  renderValidatorLab() {
    this.mountView(this.validatorLabView.render());
  }

  renderLoggerLab() {
    this.mountView(this.loggerLabView.render());
  }

  renderQuickStart() {
    this.mountView(this.quickStartView.render());
  }

  renderNotFound() {
    const main = querySelector('#main-view');
    if (!main) return;
    main.innerHTML = '';

    const notFound = createElement('div', {
      className: 'text-center py-16 space-y-4 max-w-full min-w-0'
    }, [
      createElement('h2', { className: 'text-3xl sm:text-4xl font-bold' }, '404 - Page Not Found'),
      createElement('p', { style: { color: 'var(--text-secondary)' } }, 'The requested route does not exist.'),
      createElement('button', {
        className: 'px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs sm:text-sm font-medium',
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

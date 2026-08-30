// ============================================================
//  OVERVIEW VIEW - Dashboard & Architecture Showcase
// ============================================================

import { createElement } from '../index.js';

export class OverviewView {
  constructor(app) {
    this.app = app;
  }

  render() {
    const container = createElement('div', { className: 'space-y-8 animate-fade-in w-full max-w-full min-w-0' });

    // Hero Banner with Visual Asset
    const heroBgImg = createElement('img', {
      src: this.app.assets.getUrl('hero_banner') || '/src/assets/images/vexorion_hero_banner_1788081416448.jpg',
      alt: 'Vexorion Core Architecture Ecosystem Banner',
      className: 'absolute inset-0 w-full h-full object-cover opacity-20 filter blur-[1px]'
    });
    heroBgImg.referrerPolicy = 'no-referrer';

    const hero = createElement('div', {
      className: 'rounded-2xl p-4 sm:p-6 md:p-10 border relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 w-full max-w-full min-w-0',
      style: {
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)'
      }
    }, [
      heroBgImg,
      createElement('div', { className: 'max-w-2xl space-y-4 relative z-10 w-full min-w-0' }, [
        createElement('div', { className: 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' }, [
          createElement('span', { className: 'w-2 h-2 rounded-full bg-indigo-400 shrink-0' }),
          createElement('span', { className: 'truncate' }, 'Autonomous JavaScript Architecture')
        ]),
        createElement('h1', { className: 'text-2xl sm:text-3xl md:text-5xl font-black tracking-tight break-words' }, 'The Vexorion Ecosystem'),
        createElement('p', { className: 'text-sm sm:text-base md:text-lg leading-relaxed break-words', style: { color: 'var(--text-secondary)' } },
          'A handcrafted, modular JavaScript engine providing core hardware & engine detection, reactive event emitters, bidirectional bindings, state history tracking, high-efficiency caching, asset pipelines, and multi-mode theme systems.'
        ),
        createElement('div', { className: 'flex flex-wrap gap-2.5 pt-2' }, [
          createElement('button', {
            className: 'px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-all shadow-md flex items-center gap-2',
            onclick: () => this.app.router.navigate('/todos')
          }, '🚀 Launch Interactive Todo Lab'),
          createElement('button', {
            className: 'px-4 py-2.5 rounded-lg border font-medium text-xs sm:text-sm transition-all hover:bg-slate-800/50 flex items-center gap-2',
            style: { borderColor: 'var(--border-color)' },
            onclick: () => this.app.router.navigate('/assets')
          }, '🖼️ Explore Media & Assets'),
          createElement('button', {
            className: 'px-4 py-2.5 rounded-lg border font-medium text-xs sm:text-sm transition-all hover:bg-slate-800/50 flex items-center gap-2',
            style: { borderColor: 'var(--border-color)' },
            onclick: () => this.app.router.navigate('/quickstart')
          }, '📖 Quick Start & Sandbox')
        ])
      ]),
      createElement('div', { className: 'relative z-10 w-full md:w-80 rounded-xl overflow-hidden border shadow-xl border-indigo-500/30 group shrink-0' }, [
        createElement('img', {
          src: this.app.assets.getUrl('hero_banner') || '/src/assets/images/vexorion_hero_banner_1788081416448.jpg',
          alt: 'Vexorion Visual Architecture Architecture Preview',
          className: 'w-full h-40 sm:h-48 object-cover group-hover:scale-105 transition-transform duration-300',
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
    const grid = createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full max-w-full min-w-0' });

    const cards = [
      {
        title: 'Core Engine & Detection',
        desc: 'Zero-dependency regex parser for Gecko, WebKit, Presto, Chrome, Safari, OS platform & hardware features.',
        icon: '🌐',
        badge: 'Browser.js',
        action: () => this.app.router.navigate('/browser')
      },
      {
        title: 'Reactive State & Time-Travel',
        desc: 'StateManager with path queries, deep clones, and 50-step undo/redo rollback stack.',
        icon: '🔄',
        badge: 'StateManager.js',
        action: () => this.app.router.navigate('/state')
      },
      {
        title: 'Multi-Strategy Cache',
        desc: 'CacheManager with LRU, LFU, FIFO eviction, millisecond TTL expiration, and persistence.',
        icon: '💾',
        badge: 'CacheManager.js',
        action: () => this.app.router.navigate('/cache')
      },
      {
        title: 'Asset & Media Manager',
        desc: 'Preloading pipeline, memory image cache, resolution detection, metadata registry, and direct rendering.',
        icon: '🖼️',
        badge: 'AssetManager.js',
        action: () => this.app.router.navigate('/assets')
      },
      {
        title: 'Bidirectional Binding',
        desc: 'Sync DOM inputs with store state in real-time with custom transform pipelines.',
        icon: '⚡',
        badge: 'Bidirectional.js',
        action: () => this.app.router.navigate('/todos')
      },
      {
        title: 'Stream & Batch Operations',
        desc: 'In-memory chunk streaming with pipe handling and transactional OperationGroup undo.',
        icon: '🌊',
        badge: 'StringStream.js',
        action: () => this.app.router.navigate('/stream')
      },
      {
        title: 'Schema Validator',
        desc: 'Rule engine supporting regex, email, ranges, enums, min/max length, and custom callbacks.',
        icon: '🛡️',
        badge: 'Validator.js',
        action: () => this.app.router.navigate('/validator')
      },
      {
        title: 'Live Logger Terminal',
        desc: 'Customizable logging transport with log levels, formatted outputs, and real-time UI streaming.',
        icon: '📋',
        badge: 'Logger.js',
        action: () => this.app.router.navigate('/logger')
      },
      {
        title: 'Starter Sandbox',
        desc: 'Minimal templates and sample code ready to copy-paste into any web project.',
        icon: '🚀',
        badge: 'QuickStart.js',
        action: () => this.app.router.navigate('/quickstart')
      }
    ];

    cards.forEach(c => {
      const card = createElement('div', {
        className: 'rounded-xl p-4 sm:p-5 border flex flex-col justify-between hover:border-indigo-500/50 transition-all group cursor-pointer w-full min-w-0',
        style: {
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)'
        },
        onclick: c.action
      }, [
        createElement('div', { className: 'space-y-3 min-w-0' }, [
          createElement('div', { className: 'flex items-center justify-between' }, [
            createElement('span', { className: 'text-2xl shrink-0' }, c.icon),
            createElement('span', { className: 'text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' }, c.badge)
          ]),
          createElement('h3', { className: 'font-bold text-base sm:text-lg group-hover:text-indigo-400 transition-colors break-words' }, c.title),
          createElement('p', { className: 'text-xs sm:text-sm leading-relaxed break-words', style: { color: 'var(--text-secondary)' } }, c.desc)
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
    return container;
  }
}

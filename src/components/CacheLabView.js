// ============================================================
//  CACHE LAB VIEW - Multi-Strategy Memory Cache
// ============================================================

import { createElement, querySelector } from '../index.js';

export class CacheLabView {
  constructor(app) {
    this.app = app;
  }

  render() {
    const container = createElement('div', { className: 'space-y-6 max-w-5xl mx-auto w-full min-w-0' });

    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-xl sm:text-2xl md:text-3xl font-bold break-words' }, '💾 High-Performance Cache Lab'),
      createElement('p', { className: 'text-xs sm:text-sm break-words', style: { color: 'var(--text-secondary)' } },
        'In-memory CacheManager featuring LRU/LFU/FIFO eviction strategies and millisecond TTL expiration.'
      )
    ]);

    // Top Stats Bar
    const statsBar = createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-4 gap-3 w-full min-w-0' }, [
      this.createStatBox('Active Items', `${this.app.cache.size} / ${this.app.cache.maxSize}`, '📦'),
      this.createStatBox('Hit Count', String(this.app.cache.stats.hits), '🎯'),
      this.createStatBox('Miss Count', String(this.app.cache.stats.misses), '❌'),
      this.createStatBox('Hit Ratio', `${(this.app.cache.hitRatio * 100).toFixed(1)}%`, '📊')
    ]);

    // Cache Mutator
    const formCard = createElement('div', {
      className: 'p-4 sm:p-5 rounded-xl border space-y-4 w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('h3', { className: 'text-sm sm:text-base font-bold' }, 'Insert New Cache Entry:'),
      createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full min-w-0' }, [
        createElement('input', {
          id: 'cache-key-input',
          type: 'text',
          placeholder: 'Key (e.g. user:42:profile)',
          className: 'w-full min-w-0 px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
          style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
        }),
        createElement('input', {
          id: 'cache-val-input',
          type: 'text',
          placeholder: 'Value (string or JSON)',
          className: 'w-full min-w-0 px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
          style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
        }),
        createElement('button', {
          className: 'px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-sm shrink-0',
          onclick: () => {
            const k = querySelector('#cache-key-input')?.value;
            const v = querySelector('#cache-val-input')?.value;
            if (k && v) {
              this.app.cache.set(k, v, 45000);
              this.app.renderCacheLab();
              this.app.logger.info(`[CacheManager] Set key="${k}" ttl=45s`);
            }
          }
        }, '+ Store in Cache (45s TTL)')
      ])
    ]);

    // Active Cache Table
    const tableCard = createElement('div', {
      className: 'rounded-xl border overflow-hidden w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const tableHeader = createElement('div', {
      className: 'px-4 sm:px-5 py-3 border-b flex items-center justify-between text-xs font-semibold',
      style: { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
    }, [
      createElement('span', {}, 'ACTIVE IN-MEMORY CACHE KEYS'),
      createElement('button', {
        className: 'text-rose-400 hover:underline',
        onclick: () => {
          this.app.cache.clear();
          this.app.renderCacheLab();
          this.app.logger.warn('[CacheManager] Cache storage cleared completely');
        }
      }, 'Purge All')
    ]);

    const tableContent = createElement('div', { className: 'divide-y divide-slate-800/40' });
    const keys = this.app.cache.keys();

    if (keys.length === 0) {
      tableContent.appendChild(
        createElement('div', { className: 'p-6 sm:p-8 text-center text-xs sm:text-sm text-slate-500' }, 'Cache is currently empty.')
      );
    } else {
      keys.forEach(k => {
        const item = this.app.cache.get(k);
        const row = createElement('div', {
          className: 'px-3.5 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-800/20 text-xs gap-2 w-full min-w-0'
        }, [
          createElement('div', { className: 'flex items-center gap-2.5 font-mono min-w-0 flex-1' }, [
            createElement('span', { className: 'text-indigo-400 font-bold shrink-0' }, k),
            createElement('span', { className: 'text-slate-500 shrink-0' }, '→'),
            createElement('span', { className: 'text-slate-300 truncate' }, typeof item === 'object' ? JSON.stringify(item) : String(item))
          ]),
          createElement('div', { className: 'flex items-center gap-2 shrink-0' }, [
            createElement('button', {
              className: 'px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-[11px] font-medium transition-all text-white',
              onclick: () => {
                const val = this.app.cache.get(k);
                this.app.logger.info(`[CacheManager] Cache Hit for key="${k}": ${JSON.stringify(val)}`);
                this.app.renderCacheLab();
              }
            }, 'Get / Touch'),
            createElement('button', {
              className: 'px-2 py-1 rounded text-rose-400 hover:bg-rose-500/10 text-[11px]',
              onclick: () => {
                this.app.cache.delete(k);
                this.app.renderCacheLab();
                this.app.logger.info(`[CacheManager] Evicted key="${k}"`);
              }
            }, 'Delete')
          ])
        ]);
        tableContent.appendChild(row);
      });
    }

    tableCard.appendChild(tableHeader);
    tableCard.appendChild(tableContent);

    container.appendChild(header);
    container.appendChild(statsBar);
    container.appendChild(formCard);
    container.appendChild(tableCard);
    return container;
  }

  createStatBox(label, value, icon) {
    return createElement('div', {
      className: 'p-3 sm:p-4 rounded-xl border flex items-center gap-2.5 sm:gap-3 min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('span', { className: 'text-xl sm:text-2xl shrink-0' }, icon),
      createElement('div', { className: 'min-w-0 flex-1' }, [
        createElement('div', { className: 'text-[11px] sm:text-xs text-slate-400 truncate' }, label),
        createElement('div', { className: 'text-sm sm:text-lg font-bold font-mono text-indigo-400 truncate' }, value)
      ])
    ]);
  }
}

// ============================================================
//  BROWSER LAB VIEW - Hardware & Engine Diagnostics
// ============================================================

import { createElement, getDetectionResult } from '../index.js';

export class BrowserLabView {
  constructor(app) {
    this.app = app;
  }

  render() {
    const container = createElement('div', { className: 'space-y-6 max-w-5xl mx-auto w-full min-w-0' });

    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-xl sm:text-2xl md:text-3xl font-bold break-words' }, '🌐 Browser & Engine Diagnostics'),
      createElement('p', { className: 'text-xs sm:text-sm break-words', style: { color: 'var(--text-secondary)' } },
        'Hardware and engine detection results computed at runtime via zero-dependency Browser.js flags.'
      )
    ]);

    const result = getDetectionResult();

    // UserAgent Card
    const uaCard = createElement('div', {
      className: 'p-4 sm:p-5 rounded-xl border space-y-2 w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('div', { className: 'text-xs font-mono text-indigo-400 font-bold' }, 'RAW NAVIGATOR IDENTITY'),
      createElement('div', { className: 'p-3 rounded-lg bg-slate-950 text-slate-300 font-mono text-xs break-all border border-slate-800' }, result.userAgent),
      createElement('div', { className: 'text-xs text-slate-400 flex items-center gap-2 pt-1 flex-wrap' }, [
        createElement('span', {}, 'Reported Platform:'),
        createElement('span', { className: 'font-mono text-emerald-400 font-bold' }, result.platform)
      ])
    ]);

    // Flags Breakdown Grid
    const flagSections = [
      { title: 'Rendering Engine', data: result.flags.engine, icon: '⚙️' },
      { title: 'Browser Client', data: result.flags.browser, icon: '🌍' },
      { title: 'Operating System & Platform', data: result.flags.platform, icon: '💻' },
      { title: 'Hardware & Key Features', data: result.flags.features, icon: '⚡' }
    ];

    const flagGrid = createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full min-w-0' });

    flagSections.forEach(section => {
      const card = createElement('div', {
        className: 'p-4 sm:p-5 rounded-xl border space-y-3 w-full min-w-0',
        style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
      }, [
        createElement('div', { className: 'flex items-center gap-2 font-bold text-xs sm:text-sm' }, [
          createElement('span', {}, section.icon),
          createElement('span', {}, section.title)
        ]),
        createElement('div', { className: 'space-y-1.5 font-mono text-xs divide-y divide-slate-800/50' },
          Object.entries(section.data).map(([key, val]) => {
            const isPositive = Boolean(val);
            return createElement('div', { className: 'flex items-center justify-between py-1.5 gap-2 min-w-0' }, [
              createElement('span', { className: 'text-slate-400 truncate text-[11px]' }, key),
              createElement('span', {
                className: `px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-bold shrink-0 ${
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
    return container;
  }
}

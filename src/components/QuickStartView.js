// ============================================================
//  QUICK START VIEW - Starter Guides & Live Sandbox Counter
// ============================================================

import { createElement, querySelector } from '../index.js';

export class QuickStartView {
  constructor(app) {
    this.app = app;
  }

  render() {
    const container = createElement('div', { className: 'space-y-6 max-w-5xl mx-auto w-full min-w-0' });

    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-xl sm:text-2xl md:text-3xl font-bold break-words' }, '🚀 Quick Start & Interactive Sandbox'),
      createElement('p', { className: 'text-xs sm:text-sm break-words', style: { color: 'var(--text-secondary)' } },
        'Test live minimal setup and check code snippets for integrating Vexorion in your apps.'
      )
    ]);

    // Live Counter Interactive Sandbox Box
    const sandboxCard = createElement('div', {
      className: 'p-4 sm:p-6 rounded-xl border space-y-4 w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('h3', { className: 'text-sm sm:text-base font-bold' }, 'Live Interactive Sandbox Counter:'),
      createElement('div', { className: 'flex flex-wrap items-center gap-3 sm:gap-4 w-full min-w-0' }, [
        createElement('button', {
          id: 'sandbox-inc-btn',
          className: 'px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-all shrink-0',
          onclick: () => {
            this.app.store.dispatch({ type: 'INCREMENT_COUNTER' });
            const cEl = querySelector('#sandbox-counter-val');
            if (cEl) cEl.textContent = String(this.app.store.getState().counter);
          }
        }, 'Increment Store Counter'),
        createElement('div', { className: 'flex items-center gap-2 text-xs sm:text-sm font-mono' }, [
          createElement('span', { className: 'text-slate-400' }, 'Count:'),
          createElement('span', {
            id: 'sandbox-counter-val',
            className: 'text-xl sm:text-2xl font-bold text-emerald-400'
          }, String(this.app.store.getState().counter))
        ]),
        createElement('button', {
          className: 'px-3 py-1.5 rounded border text-xs font-medium hover:bg-slate-800 shrink-0',
          style: { borderColor: 'var(--border-color)' },
          onclick: () => {
            this.app.store.dispatch({ type: 'RESET_COUNTER' });
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
      className: 'p-4 sm:p-5 rounded-xl border space-y-2 w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('div', { className: 'flex items-center justify-between flex-wrap gap-2' }, [
        createElement('span', { className: 'text-xs font-mono font-bold text-indigo-400' }, 'SAMPLE BOOTSTRAP SCRIPT'),
        createElement('span', { className: 'text-xs text-slate-400' }, 'ES Module Syntax')
      ]),
      createElement('pre', {
        className: 'p-3 sm:p-4 rounded-lg bg-slate-950 text-indigo-300 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-w-full'
      }, codeSnippet)
    ]);

    container.appendChild(header);
    container.appendChild(sandboxCard);
    container.appendChild(codeCard);
    return container;
  }
}

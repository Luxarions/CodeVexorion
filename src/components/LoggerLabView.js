// ============================================================
//  LOGGER LAB VIEW - Live Event Console & Transports
// ============================================================

import { createElement, querySelector } from '../index.js';

export class LoggerLabView {
  constructor(app) {
    this.app = app;
    this.isTransportAdded = false;
  }

  render() {
    const container = createElement('div', { className: 'space-y-6 max-w-5xl mx-auto w-full min-w-0' });

    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-xl sm:text-2xl md:text-3xl font-bold break-words' }, '📋 Live Logger Terminal'),
      createElement('p', { className: 'text-xs sm:text-sm break-words', style: { color: 'var(--text-secondary)' } },
        'Logger.js event stream capturing levels: debug, info, warn, error, and fatal.'
      )
    ]);

    const terminalCard = createElement('div', {
      className: 'rounded-xl border overflow-hidden w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const termHeader = createElement('div', {
      className: 'px-4 py-3 border-b flex items-center justify-between flex-wrap gap-2',
      style: { borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }
    }, [
      createElement('div', { className: 'flex items-center gap-2' }, [
        createElement('span', { className: 'w-3 h-3 rounded-full bg-rose-500 shrink-0' }),
        createElement('span', { className: 'w-3 h-3 rounded-full bg-amber-500 shrink-0' }),
        createElement('span', { className: 'w-3 h-3 rounded-full bg-emerald-500 shrink-0' }),
        createElement('span', { className: 'text-xs font-mono font-bold text-slate-300 pl-2 truncate' }, 'Vexorion Logger Console')
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
      className: 'p-3 sm:p-4 bg-slate-950 font-mono text-xs h-72 overflow-y-auto space-y-1 w-full min-w-0'
    });

    // Add DOM transport to logger once
    if (!this.isTransportAdded) {
      this.app.logger.addTransport({
        type: 'live-ui',
        handler: (entry) => {
          const body = querySelector('#live-log-container');
          if (!body) return;
          const colorClass =
            entry.level === 'error' || entry.level === 'fatal' ? 'text-rose-400' :
            entry.level === 'warn' ? 'text-amber-400' :
            entry.level === 'debug' ? 'text-cyan-400' : 'text-slate-300';

          const line = createElement('div', { className: `${colorClass} break-all text-[11px] sm:text-xs` }, entry.formatted);
          body.appendChild(line);
          body.scrollTop = body.scrollHeight;
        }
      });
      this.isTransportAdded = true;
    }

    const triggerControls = createElement('div', {
      className: 'p-3 sm:p-4 border-t flex flex-wrap gap-2 w-full min-w-0',
      style: { borderColor: 'var(--border-color)' }
    }, [
      createElement('button', {
        className: 'px-3 py-1.5 rounded bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 text-xs font-medium',
        onclick: () => this.app.logger.debug('Debug trace packet received', { latency: '12ms' })
      }, '+ Log Debug'),
      createElement('button', {
        className: 'px-3 py-1.5 rounded bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-medium',
        onclick: () => this.app.logger.info('System status is nominal', { healthy: true })
      }, '+ Log Info'),
      createElement('button', {
        className: 'px-3 py-1.5 rounded bg-amber-600/20 text-amber-400 border border-amber-500/30 text-xs font-medium',
        onclick: () => this.app.logger.warn('High memory usage threshold warning (78%)')
      }, '+ Log Warn'),
      createElement('button', {
        className: 'px-3 py-1.5 rounded bg-rose-600/20 text-rose-400 border border-rose-500/30 text-xs font-medium',
        onclick: () => this.app.logger.error('Simulated error: Network socket retry limit reached', { retryCount: 3 })
      }, '+ Log Error')
    ]);

    terminalCard.appendChild(termHeader);
    terminalCard.appendChild(logBody);
    terminalCard.appendChild(triggerControls);

    container.appendChild(header);
    container.appendChild(terminalCard);

    // Initial logs
    setTimeout(() => {
      this.app.logger.info('Logger console initialized and connected');
    }, 50);

    return container;
  }
}

// ============================================================
//  STATE LAB VIEW - StateManager & Time-Travel Snapshots
// ============================================================

import { createElement, querySelector } from '../index.js';

export class StateLabView {
  constructor(app) {
    this.app = app;
  }

  render() {
    const container = createElement('div', { className: 'space-y-6 max-w-5xl mx-auto w-full min-w-0' });

    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-xl sm:text-2xl md:text-3xl font-bold break-words' }, '🔄 StateManager & Time-Travel Lab'),
      createElement('p', { className: 'text-xs sm:text-sm break-words', style: { color: 'var(--text-secondary)' } },
        'Live deep-path mutation engine with automatic state snapshots and full Undo / Redo history rollback.'
      )
    ]);

    // Top Controls (Undo, Redo, Reset)
    const controls = createElement('div', {
      className: 'p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const btnGroup = createElement('div', { className: 'flex flex-wrap items-center gap-2' });

    const undoBtn = createElement('button', {
      id: 'undo-btn',
      className: 'px-3.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs flex items-center gap-1.5 transition-all',
      onclick: () => {
        if (this.app.stateManager.canUndo) {
          this.app.stateManager.undo();
          this.updateView();
          this.app.logger.info('[StateManager] Undo action executed');
        }
      }
    }, '↶ Undo');

    const redoBtn = createElement('button', {
      id: 'redo-btn',
      className: 'px-3.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs flex items-center gap-1.5 transition-all',
      onclick: () => {
        if (this.app.stateManager.canRedo) {
          this.app.stateManager.redo();
          this.updateView();
          this.app.logger.info('[StateManager] Redo action executed');
        }
      }
    }, '↷ Redo');

    const resetBtn = createElement('button', {
      className: 'px-3.5 py-1.5 rounded-lg border text-rose-400 border-rose-500/30 hover:bg-rose-500/10 font-medium text-xs transition-all',
      onclick: () => {
        this.app.stateManager.reset({
          user: { profile: { username: 'default_user', tier: 'free' } }
        });
        this.updateView();
        this.app.logger.warn('[StateManager] State reset to baseline');
      }
    }, 'Reset State');

    btnGroup.appendChild(undoBtn);
    btnGroup.appendChild(redoBtn);
    btnGroup.appendChild(resetBtn);

    const historyStatus = createElement('div', {
      id: 'history-status',
      className: 'text-xs font-mono break-all',
      style: { color: 'var(--text-secondary)' }
    }, `History Stack: ${this.app.stateManager.history.length} snapshots | Future: ${this.app.stateManager.future.length}`);

    controls.appendChild(btnGroup);
    controls.appendChild(historyStatus);

    // Interactive Mutator Form
    const mutatorCard = createElement('div', {
      className: 'p-4 sm:p-5 rounded-xl border space-y-4 w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('h3', { className: 'text-sm sm:text-base font-bold' }, 'Mutate State via Deep Path:'),
      createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full min-w-0' }, [
        createElement('input', {
          id: 'state-path-input',
          type: 'text',
          value: 'user.profile.tier',
          placeholder: 'Path (e.g. user.profile.tier)',
          className: 'w-full min-w-0 px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
          style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
        }),
        createElement('input', {
          id: 'state-val-input',
          type: 'text',
          value: 'platinum_vip',
          placeholder: 'New Value',
          className: 'w-full min-w-0 px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
          style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
        }),
        createElement('button', {
          className: 'px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-sm shrink-0',
          onclick: () => {
            const p = querySelector('#state-path-input')?.value;
            const v = querySelector('#state-val-input')?.value;
            if (p) {
              this.app.stateManager.set(p, v);
              this.updateView();
              this.app.logger.info(`[StateManager] Mutated ${p} -> "${v}"`);
            }
          }
        }, 'Apply Mutation (set)')
      ])
    ]);

    // Live State Inspector Code Box
    const viewerCard = createElement('div', {
      className: 'p-4 sm:p-5 rounded-xl border space-y-2 w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('div', { className: 'flex items-center justify-between' }, [
        createElement('span', { className: 'text-xs font-mono font-bold text-indigo-400' }, 'LIVE STATE TREE (IMMUTABLE SNAPSHOT)'),
        createElement('span', { className: 'text-xs text-slate-400 font-mono' }, 'JSON Structure')
      ]),
      createElement('pre', {
        id: 'state-json-viewer',
        className: 'p-3 sm:p-4 rounded-lg bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-w-full'
      }, JSON.stringify(this.app.stateManager.getState(), null, 2))
    ]);

    container.appendChild(header);
    container.appendChild(controls);
    container.appendChild(mutatorCard);
    container.appendChild(viewerCard);
    return container;
  }

  updateView() {
    const viewer = querySelector('#state-json-viewer');
    if (viewer) {
      viewer.textContent = JSON.stringify(this.app.stateManager.getState(), null, 2);
    }
    const status = querySelector('#history-status');
    if (status) {
      status.textContent = `History Stack: ${this.app.stateManager.history.length} snapshots | Future: ${this.app.stateManager.future.length}`;
    }
    const undoBtn = querySelector('#undo-btn');
    if (undoBtn) {
      undoBtn.className = `px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
        this.app.stateManager.canUndo ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
      }`;
    }
    const redoBtn = querySelector('#redo-btn');
    if (redoBtn) {
      redoBtn.className = `px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
        this.app.stateManager.canRedo ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'
      }`;
    }
  }
}

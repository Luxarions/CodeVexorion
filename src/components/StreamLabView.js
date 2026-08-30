// ============================================================
//  STREAM LAB VIEW - StringStream & OperationGroup Transactions
// ============================================================

import { createElement, querySelector, StringStream, OperationGroup, randomId } from '../index.js';

export class StreamLabView {
  constructor(app) {
    this.app = app;
  }

  render() {
    const container = createElement('div', { className: 'space-y-6 max-w-5xl mx-auto w-full min-w-0' });

    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-xl sm:text-2xl md:text-3xl font-bold break-words' }, '🌊 StringStream & OperationGroup'),
      createElement('p', { className: 'text-xs sm:text-sm break-words', style: { color: 'var(--text-secondary)' } },
        'Test in-memory streaming pipelines, transformation chains, and atomic operation transactions.'
      )
    ]);

    // Stream Lab Card
    const streamCard = createElement('div', {
      className: 'p-4 sm:p-5 rounded-xl border space-y-4 w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const stream = new StringStream();
    const outputConsole = createElement('div', {
      id: 'stream-console',
      className: 'p-3 sm:p-4 rounded-lg bg-slate-950 font-mono text-xs text-cyan-400 h-36 overflow-y-auto border border-slate-800 space-y-1 w-full min-w-0'
    });

    stream.on('data', (chunk) => {
      const line = createElement('div', { className: 'break-all' }, `[STREAM WRITE] >> "${chunk}" (Buffer: ${stream.length})`);
      outputConsole.appendChild(line);
      outputConsole.scrollTop = outputConsole.scrollHeight;
    });

    stream.on('read', (data) => {
      const line = createElement('div', { className: 'text-emerald-400 font-bold break-all' }, `[STREAM READ] << "${data}"`);
      outputConsole.appendChild(line);
      outputConsole.scrollTop = outputConsole.scrollHeight;
    });

    const streamControls = createElement('div', { className: 'flex flex-wrap gap-2 w-full min-w-0' }, [
      createElement('button', {
        className: 'px-3 py-1.5 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs',
        onclick: () => {
          const chunk = `Packet_${randomId(4)} `;
          stream.write(chunk);
        }
      }, 'Write Random Chunk'),
      createElement('button', {
        className: 'px-3 py-1.5 sm:py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs',
        onclick: () => {
          stream.read(8);
        }
      }, 'Read 8 Bytes'),
      createElement('button', {
        className: 'px-3 py-1.5 sm:py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium text-xs',
        onclick: () => {
          stream.readAll();
        }
      }, 'Read All'),
      createElement('button', {
        className: 'px-3 py-1.5 sm:py-2 rounded-lg border text-xs font-medium hover:bg-slate-800',
        style: { borderColor: 'var(--border-color)' },
        onclick: () => {
          stream.transform(text => text.toUpperCase());
        }
      }, 'Transform -> UPPERCASE'),
      createElement('button', {
        className: 'px-3 py-1.5 sm:py-2 rounded-lg border text-rose-400 border-rose-500/30 hover:bg-rose-500/10 text-xs font-medium',
        onclick: () => {
          stream.clear();
          outputConsole.innerHTML = '<div class="text-slate-500">Stream buffer cleared.</div>';
        }
      }, 'Clear Stream')
    ]);

    streamCard.appendChild(createElement('h3', { className: 'font-bold text-sm sm:text-base' }, '1. Interactive StringStream Pipeline:'));
    streamCard.appendChild(streamControls);
    streamCard.appendChild(outputConsole);

    // OperationGroup Transaction Lab
    const opCard = createElement('div', {
      className: 'p-4 sm:p-5 rounded-xl border space-y-4 w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const opGroup = new OperationGroup({ name: 'UserTransactionGroup' });
    let balance = 1000;

    const balanceDisplay = createElement('div', { className: 'text-xs sm:text-sm font-mono flex items-center gap-2 flex-wrap' }, [
      createElement('span', { className: 'text-slate-400' }, 'Current Transaction Balance:'),
      createElement('span', { id: 'balance-val', className: 'text-emerald-400 font-bold text-base sm:text-lg' }, `$${balance}`)
    ]);

    const updateBalanceUI = () => {
      const bEl = querySelector('#balance-val');
      if (bEl) bEl.textContent = `$${balance}`;
    };

    const opControls = createElement('div', { className: 'flex flex-wrap gap-2 w-full min-w-0' }, [
      createElement('button', {
        className: 'px-3 py-1.5 sm:py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium',
        onclick: () => {
          const depositAmount = 250;
          opGroup.addOperation({
            name: `Deposit +$${depositAmount}`,
            execute: () => { balance += depositAmount; updateBalanceUI(); return depositAmount; },
            undo: (result) => { balance -= result; updateBalanceUI(); }
          });
          opGroup.execute();
          this.app.logger.info(`[OperationGroup] Executed deposit: +$${depositAmount}`);
        }
      }, '+ Deposit $250'),
      createElement('button', {
        className: 'px-3 py-1.5 sm:py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium',
        onclick: () => {
          const withdrawAmount = 100;
          opGroup.addOperation({
            name: `Withdraw -$${withdrawAmount}`,
            execute: () => { balance -= withdrawAmount; updateBalanceUI(); return withdrawAmount; },
            undo: (result) => { balance -= result; updateBalanceUI(); }
          });
          opGroup.execute();
          this.app.logger.info(`[OperationGroup] Executed withdrawal: -$${withdrawAmount}`);
        }
      }, '- Withdraw $100'),
      createElement('button', {
        className: 'px-3 py-1.5 sm:py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs font-medium',
        onclick: () => {
          opGroup.undo();
          this.app.logger.info('[OperationGroup] Rolled back last operation');
        }
      }, '↶ Undo Transaction')
    ]);

    opCard.appendChild(createElement('h3', { className: 'font-bold text-sm sm:text-base' }, '2. OperationGroup Transaction Stack:'));
    opCard.appendChild(balanceDisplay);
    opCard.appendChild(opControls);

    container.appendChild(header);
    container.appendChild(streamCard);
    container.appendChild(opCard);
    return container;
  }
}

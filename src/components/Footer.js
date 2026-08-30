// ============================================================
//  FOOTER COMPONENT - Responsive Modular Footer
// ============================================================

import { createElement } from '../index.js';

export class Footer {
  render() {
    return createElement('footer', {
      className: 'border-t py-6 px-4 md:px-8 text-center text-xs transition-colors duration-200 flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-full min-w-0 mt-auto',
      style: {
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-secondary)'
      }
    }, [
      createElement('div', { className: 'flex items-center gap-2' }, [
        createElement('span', { className: 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0' }),
        createElement('span', { className: 'font-medium' }, 'Vexorion Custom Engine • All Modules Active')
      ]),
      createElement('div', { className: 'font-mono text-[11px] text-slate-400 break-words' }, 'Pure JavaScript • Zero Dependencies • Modularity & Performance'),
      createElement('div', { className: 'text-[11px]' }, '© 2026 Vexorion Framework')
    ]);
  }
}

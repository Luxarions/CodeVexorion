// ============================================================
//  VALIDATOR LAB VIEW - Schema Engine & Field Rules
// ============================================================

import { createElement, querySelector } from '../index.js';

export class ValidatorLabView {
  constructor(app) {
    this.app = app;
  }

  render() {
    const container = createElement('div', { className: 'space-y-6 max-w-4xl mx-auto w-full min-w-0' });

    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-xl sm:text-2xl md:text-3xl font-bold break-words' }, '🛡️ Validator & Schema Engine'),
      createElement('p', { className: 'text-xs sm:text-sm break-words', style: { color: 'var(--text-secondary)' } },
        'Live schema validation testing email, required, min, max, integer, and enum rules.'
      )
    ]);

    const formCard = createElement('div', {
      className: 'p-4 sm:p-6 rounded-xl border space-y-4 w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const formGrid = createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full min-w-0' }, [
      this.createFormField('Username (required, 4-20 chars)', 'val-username', 'vexor_coder'),
      this.createFormField('Email Address (required, valid email)', 'val-email', 'coder@vexorion.io'),
      this.createFormField('Age (integer, 18-120)', 'val-age', '28'),
      this.createFormField('Role (developer, designer, manager, architect)', 'val-role', 'architect')
    ]);

    const resultBox = createElement('div', {
      id: 'val-result-box',
      className: 'p-3 sm:p-4 rounded-lg bg-slate-950 font-mono text-xs border border-slate-800 break-words whitespace-pre-wrap max-w-full'
    }, 'Fill form and click Validate below.');

    const validateBtn = createElement('button', {
      className: 'px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-all shadow-sm shrink-0',
      onclick: () => {
        const payload = {
          username: querySelector('#val-username')?.value,
          email: querySelector('#val-email')?.value,
          age: querySelector('#val-age')?.value,
          role: querySelector('#val-role')?.value
        };

        const { isValid, errors } = this.app.validator.validateSchema(payload, 'userProfile');
        const box = querySelector('#val-result-box');
        if (box) {
          if (isValid) {
            box.className = 'p-3 sm:p-4 rounded-lg bg-emerald-950/40 text-emerald-400 font-mono text-xs border border-emerald-800/50 break-words whitespace-pre-wrap max-w-full';
            box.textContent = `✅ Validation SUCCESS! All rules passed:\n${JSON.stringify(payload, null, 2)}`;
          } else {
            box.className = 'p-3 sm:p-4 rounded-lg bg-rose-950/40 text-rose-400 font-mono text-xs border border-rose-800/50 break-words whitespace-pre-wrap max-w-full';
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
    return container;
  }

  createFormField(label, id, defaultValue) {
    return createElement('div', { className: 'space-y-1.5 min-w-0' }, [
      createElement('label', { className: 'text-xs font-semibold text-slate-300 block truncate' }, label),
      createElement('input', {
        id,
        type: 'text',
        value: defaultValue,
        className: 'w-full min-w-0 px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
        style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
      })
    ]);
  }
}

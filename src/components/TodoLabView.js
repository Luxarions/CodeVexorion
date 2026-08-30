// ============================================================
//  TODO LAB VIEW - Bidirectional 2-Way Data Binding
// ============================================================

import { createElement, querySelector, Bidirectional } from '../index.js';

export class TodoLabView {
  constructor(app) {
    this.app = app;
  }

  render() {
    const container = createElement('div', { className: 'space-y-6 max-w-4xl mx-auto w-full min-w-0' });

    // Title
    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-xl sm:text-2xl md:text-3xl font-bold break-words' }, '📝 Todo App with Bidirectional Binding'),
      createElement('p', { className: 'text-xs sm:text-sm break-words', style: { color: 'var(--text-secondary)' } },
        'Demonstrating two-way DOM sync using Bidirectional.js bound with Store.js reducers and EventEmitter.'
      )
    ]);

    // Live binding preview banner
    const liveSyncBanner = createElement('div', {
      className: 'p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-2 w-full min-w-0',
      style: { backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('div', { className: 'flex items-center gap-2 shrink-0' }, [
        createElement('span', { className: 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse' }),
        createElement('span', {}, 'Bidirectional Input Stream:')
      ]),
      createElement('span', { id: 'live-input-mirror', className: 'text-indigo-400 font-bold break-all' }, '(type below to preview live binding)')
    ]);

    // Input form
    const formCard = createElement('div', {
      className: 'p-4 sm:p-5 rounded-xl border space-y-4 w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const inputGroup = createElement('div', { className: 'flex flex-col sm:flex-row gap-2.5 sm:gap-3 w-full min-w-0' });

    const input = createElement('input', {
      id: 'todo-input-field',
      type: 'text',
      placeholder: 'Enter new task item...',
      className: 'flex-1 w-full min-w-0 px-3.5 py-2.5 rounded-lg border outline-none focus:ring-2 focus:ring-indigo-500 text-xs sm:text-sm transition-all',
      style: {
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)'
      }
    });

    const addBtn = createElement('button', {
      className: 'px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs sm:text-sm transition-all shadow-sm shrink-0'
    }, '+ Add Todo');

    inputGroup.appendChild(input);
    inputGroup.appendChild(addBtn);
    formCard.appendChild(inputGroup);

    // Bind input field bidirectionally
    const mirrorEl = liveSyncBanner.querySelector('#live-input-mirror');
    const binder = new Bidirectional({
      twoWay: true,
      immediate: false,
      transform: (val) => val ? `"${val}" [${val.length} chars]` : '(empty)'
    });

    binder.bind(
      () => input.value,
      (val) => {
        if (mirrorEl) mirrorEl.textContent = val;
      }
    );

    input.addEventListener('input', () => {
      binder.update();
    });

    // Add action handler
    const handleAdd = () => {
      const text = input.value.trim();
      if (!text) return;
      this.app.store.dispatch({
        type: 'ADD_TODO',
        payload: { id: Date.now(), text, done: false }
      });
      input.value = '';
      binder.update();
      this.app.logger.info(`[Store] Dispatched ADD_TODO: "${text}"`);
    };

    addBtn.addEventListener('click', handleAdd);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleAdd();
    });

    // Todo List Container
    const listCard = createElement('div', {
      className: 'rounded-xl border overflow-hidden w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const listHeader = createElement('div', {
      className: 'px-4 sm:px-5 py-3 border-b flex items-center justify-between text-xs font-semibold',
      style: { borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }
    }, [
      createElement('span', {}, 'TASK LIST'),
      createElement('span', { id: 'todo-count-badge' }, `${this.app.store.getState().todos.length} Items`)
    ]);

    const todoList = createElement('ul', {
      id: 'todo-items-list',
      className: 'divide-y divide-slate-700/30'
    });

    listCard.appendChild(listHeader);
    listCard.appendChild(todoList);

    // Render list items function
    const renderItems = (todos) => {
      todoList.innerHTML = '';
      const countBadge = listCard.querySelector('#todo-count-badge');
      if (countBadge) countBadge.textContent = `${todos.length} Items (${todos.filter(t => t.done).length} completed)`;

      if (todos.length === 0) {
        todoList.appendChild(
          createElement('li', {
            className: 'p-6 sm:p-8 text-center text-xs sm:text-sm',
            style: { color: 'var(--text-secondary)' }
          }, '🎉 All tasks completed! Add a new task above.')
        );
        return;
      }

      todos.forEach(todo => {
        const item = createElement('li', {
          className: 'px-3.5 sm:px-5 py-3 flex items-center justify-between hover:bg-slate-800/20 transition-colors gap-2 w-full min-w-0'
        }, [
          createElement('div', {
            className: 'flex items-center gap-2.5 sm:gap-3 cursor-pointer flex-1 min-w-0',
            onclick: () => {
              this.app.store.dispatch({ type: 'TOGGLE_TODO', payload: todo.id });
            }
          }, [
            createElement('button', {
              className: `w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-all border shrink-0 ${
                todo.done ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-500 text-transparent'
              }`
            }, '✓'),
            createElement('span', {
              className: `text-xs sm:text-sm select-none break-words min-w-0 flex-1 ${todo.done ? 'line-through opacity-50' : 'font-medium'}`
            }, todo.text)
          ]),
          createElement('button', {
            className: 'p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0',
            title: 'Delete Todo',
            onclick: (e) => {
              e.stopPropagation();
              this.app.store.dispatch({ type: 'REMOVE_TODO', payload: todo.id });
              this.app.logger.info(`[Store] Dispatched REMOVE_TODO id=${todo.id}`);
            }
          }, '🗑️')
        ]);
        todoList.appendChild(item);
      });
    };

    renderItems(this.app.store.getState().todos);

    // Subscribe to store updates
    this.app.store.subscribe(s => s.todos, (todos) => {
      renderItems(todos);
    });

    container.appendChild(header);
    container.appendChild(liveSyncBanner);
    container.appendChild(formCard);
    container.appendChild(listCard);
    return container;
  }
}

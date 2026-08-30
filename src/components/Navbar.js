// ============================================================
//  NAVBAR COMPONENT - Modular Header & Navigation
// ============================================================

import { createElement, querySelector, querySelectorAll } from '../index.js';

export class Navbar {
  constructor(app) {
    this.app = app;
    this.isMobileMenuOpen = false;
  }

  render() {
    const header = createElement('header', {
      className: 'sticky top-0 z-50 backdrop-blur-md border-b px-3 sm:px-6 py-2.5 flex items-center justify-between transition-colors duration-200 w-full max-w-full min-w-0',
      style: {
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)'
      }
    });

    // Brand / Logo
    const logoImg = createElement('img', {
      src: this.app.assets.getUrl('logo') || '/src/assets/images/vexorion_logo_1788081398062.jpg',
      alt: 'Vexorion Framework Official Logo',
      className: 'w-8 h-8 sm:w-9 sm:h-9 rounded-lg object-cover shadow-sm border border-indigo-500/30 shrink-0'
    });
    logoImg.referrerPolicy = 'no-referrer';

    const brand = createElement('div', {
      className: 'flex items-center gap-2.5 cursor-pointer select-none min-w-0 shrink-0',
      onclick: () => this.app.router.navigate('/')
    }, [
      logoImg,
      createElement('div', { className: 'min-w-0 flex flex-col' }, [
        createElement('div', { className: 'font-bold tracking-tight text-sm sm:text-base flex items-center gap-1.5' }, [
          createElement('span', { className: 'truncate' }, 'VEXORION'),
          createElement('span', {
            className: 'text-[9px] sm:text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
          }, 'Core v2.4')
        ]),
        createElement('div', { className: 'text-[10px] sm:text-xs text-slate-400 font-normal truncate hidden xs:block' }, 'Pure Custom JS Engine')
      ])
    ]);

    // Desktop Navigation Links
    const desktopNav = createElement('nav', {
      className: 'hidden xl:flex items-center space-x-1 font-medium text-sm'
    });

    const routes = [
      { path: '/', label: 'Overview', icon: '⚡' },
      { path: '/todos', label: 'Todo & Binding', icon: '📝' },
      { path: '/state', label: 'StateManager', icon: '🔄' },
      { path: '/cache', label: 'Cache System', icon: '💾' },
      { path: '/assets', label: 'Media & Assets', icon: '🖼️' },
      { path: '/browser', label: 'Browser Info', icon: '🌐' },
      { path: '/stream', label: 'Stream & Ops', icon: '🌊' },
      { path: '/validator', label: 'Validator', icon: '🛡️' },
      { path: '/logger', label: 'Logs', icon: '📋' },
      { path: '/quickstart', label: 'Quick Start', icon: '🚀' }
    ];

    routes.forEach(route => {
      const link = createElement('button', {
        className: 'nav-link px-2.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1 text-xs font-medium whitespace-nowrap',
        dataset: { path: route.path },
        onclick: () => {
          this.app.router.navigate(route.path);
        }
      }, [
        createElement('span', {}, route.icon),
        createElement('span', {}, route.label)
      ]);
      desktopNav.appendChild(link);
    });

    // Right Controls: Mode Switcher, Mobile Toggle, Profile Avatar
    const rightControls = createElement('div', { className: 'flex items-center gap-1.5 sm:gap-2.5 shrink-0' });

    // Mode Switcher
    const modeSwitcher = createElement('div', {
      className: 'flex items-center p-0.5 sm:p-1 rounded-lg border text-xs gap-0.5',
      style: {
        backgroundColor: 'var(--bg-tertiary)',
        borderColor: 'var(--border-color)'
      }
    });

    const modeList = [
      { name: 'dark', icon: '🌙', title: 'Dark' },
      { name: 'light', icon: '☀️', title: 'Light' },
      { name: 'accessibility', icon: '👁️', title: 'A11y' },
      { name: 'compact', icon: '📐', title: 'Compact' }
    ];

    modeList.forEach(m => {
      const btn = createElement('button', {
        className: `mode-btn px-2 sm:px-2.5 py-1 rounded transition-all font-medium flex items-center gap-1 ${
          m.name === this.app.currentModeName ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
        }`,
        dataset: { mode: m.name },
        title: `${m.title} Mode`,
        onclick: () => this.app.switchMode(m.name)
      }, [
        createElement('span', {}, m.icon),
        createElement('span', { className: 'hidden md:inline text-[11px]' }, m.title)
      ]);
      modeSwitcher.appendChild(btn);
    });

    // Avatar Button
    const avatarImg = createElement('img', {
      src: this.app.assets.getUrl('architect_avatar') || '/src/assets/images/developer_avatar_1788081430918.jpg',
      alt: 'Architect Profile Avatar',
      className: 'w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-indigo-500/40 shadow-sm hover:scale-105 transition-transform cursor-pointer shrink-0',
      title: 'Architect Profile & Media',
      onclick: () => this.app.router.navigate('/assets')
    });
    avatarImg.referrerPolicy = 'no-referrer';

    // Mobile Hamburger Menu Button
    const mobileMenuBtn = createElement('button', {
      id: 'mobile-menu-toggle',
      className: 'xl:hidden p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 transition-all flex items-center justify-center',
      title: 'Toggle Navigation Menu',
      onclick: () => this.toggleMobileMenu()
    }, [
      createElement('span', { className: 'text-sm font-bold' }, '☰')
    ]);

    rightControls.appendChild(modeSwitcher);
    rightControls.appendChild(avatarImg);
    rightControls.appendChild(mobileMenuBtn);

    header.appendChild(brand);
    header.appendChild(desktopNav);
    header.appendChild(rightControls);

    return header;
  }

  renderMobileMenu() {
    const routes = [
      { path: '/', label: 'Overview', icon: '⚡' },
      { path: '/todos', label: 'Todo & Binding', icon: '📝' },
      { path: '/state', label: 'StateManager', icon: '🔄' },
      { path: '/cache', label: 'Cache System', icon: '💾' },
      { path: '/assets', label: 'Media & Assets', icon: '🖼️' },
      { path: '/browser', label: 'Browser Info', icon: '🌐' },
      { path: '/stream', label: 'Stream & Ops', icon: '🌊' },
      { path: '/validator', label: 'Validator', icon: '🛡️' },
      { path: '/logger', label: 'Logs', icon: '📋' },
      { path: '/quickstart', label: 'Quick Start', icon: '🚀' }
    ];

    // Mobile horizontal swipe bar (always visible below header on small screens)
    const mobileNavContainer = createElement('div', {
      id: 'mobile-nav-bar',
      className: 'xl:hidden w-full max-w-full overflow-x-auto py-2 px-3 flex items-center gap-1.5 border-b text-xs scrollbar-none',
      style: {
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        WebkitOverflowScrolling: 'touch'
      }
    });

    routes.forEach(route => {
      const mLink = createElement('button', {
        className: 'nav-link-mobile shrink-0 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all flex items-center gap-1',
        style: { borderColor: 'var(--border-color)' },
        dataset: { path: route.path },
        onclick: () => {
          this.app.router.navigate(route.path);
        }
      }, [
        createElement('span', {}, route.icon),
        createElement('span', {}, route.label)
      ]);
      mobileNavContainer.appendChild(mLink);
    });

    return mobileNavContainer;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    const bar = querySelector('#mobile-nav-bar');
    if (bar) {
      bar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

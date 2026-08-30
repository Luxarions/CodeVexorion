// ============================================================
//  ASSET LAB VIEW - Media, Avatar, Logo, Banner & 65-Icon Catalog
// ============================================================

import { createElement, querySelector } from '../index.js';

export class AssetLabView {
  constructor(app) {
    this.app = app;
    this.mainFilter = 'all';
    this.iconSubFilter = 'all';
    this.searchQuery = '';
  }

  render() {
    const container = createElement('div', { className: 'space-y-6 max-w-7xl mx-auto w-full min-w-0' });

    const header = createElement('div', { className: 'space-y-2' }, [
      createElement('h2', { className: 'text-xl sm:text-2xl md:text-3xl font-bold break-words' }, '🖼️ Media Pipeline & AssetManager'),
      createElement('p', { className: 'text-xs sm:text-sm break-words', style: { color: 'var(--text-secondary)' } },
        'Zero-dependency asset pipeline with preloading, in-memory caching, progress tracking, category separation (Icons, Avatars, Logos, Banners), and ES modular imports.'
      )
    ]);

    // Top Stats Bar
    const statsBar = createElement('div', { className: 'grid grid-cols-2 sm:grid-cols-4 gap-3 w-full min-w-0' }, [
      this.createStatBox('Total Registered', `${this.app.assets.count} Assets`, '📦'),
      this.createStatBox('In-Memory Loaded', `${this.app.assets.loadedCount} Ready`, '⚡'),
      this.createStatBox('Active Memory', `${this.app.assets.memoryUsageEstimate}`, '💾'),
      this.createStatBox('Catalog', '65 Icons + 3 Media', '🧭')
    ]);

    // Progress Bar
    const progressBarWrapper = createElement('div', {
      id: 'preload-progress-wrapper',
      className: 'hidden p-4 rounded-xl border space-y-2 transition-all w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('div', { className: 'flex items-center justify-between text-xs font-mono' }, [
        createElement('span', { id: 'preload-status-text', className: 'text-indigo-400 font-bold truncate' }, 'Preloading Assets...'),
        createElement('span', { id: 'preload-percent-text', className: 'text-slate-300 font-bold shrink-0' }, '0%')
      ]),
      createElement('div', { className: 'w-full h-2.5 bg-slate-800 rounded-full overflow-hidden' }, [
        createElement('div', {
          id: 'preload-progress-bar',
          className: 'h-full bg-indigo-500 transition-all duration-150',
          style: { width: '0%' }
        })
      ])
    ]);

    // Batch Actions Card
    const actionsCard = createElement('div', {
      className: 'p-4 sm:p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('div', { className: 'space-y-1 min-w-0' }, [
        createElement('h3', { className: 'text-sm sm:text-base font-bold' }, 'Batch Preload & Memory Controls'),
        createElement('p', { className: 'text-xs text-slate-400' }, 'Pre-fetch and resolve all 68 assets into browser memory cache for zero-latency rendering.')
      ]),
      createElement('div', { className: 'flex flex-wrap items-center gap-2 shrink-0' }, [
        createElement('button', {
          className: 'px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-sm flex items-center gap-1.5',
          onclick: async () => {
            const wrapper = querySelector('#preload-progress-wrapper');
            const pText = querySelector('#preload-percent-text');
            const sText = querySelector('#preload-status-text');
            const bar = querySelector('#preload-progress-bar');

            if (wrapper) wrapper.classList.remove('hidden');

            try {
              await this.app.assets.preloadAll(({ loaded, total, percent, current }) => {
                if (bar) bar.style.width = `${percent}%`;
                if (pText) pText.textContent = `${percent}% (${loaded}/${total})`;
                if (sText) sText.textContent = `Preloading [${current}]...`;
              });

              if (sText) sText.textContent = '✅ All 68 Assets Loaded into Memory Cache!';
              this.app.logger.info(`[AssetManager] Successfully preloaded all ${this.app.assets.count} assets`);
              setTimeout(() => {
                this.app.renderAssetLab();
              }, 600);
            } catch (err) {
              if (sText) sText.textContent = `❌ Preload error: ${err.message}`;
              this.app.logger.error(`[AssetManager] Preload failure: ${err.message}`);
            }
          }
        }, '⚡ Preload All (68 Assets)'),
        createElement('button', {
          className: 'px-3.5 py-2 rounded-lg border text-rose-400 border-rose-500/30 hover:bg-rose-500/10 text-xs font-medium transition-all',
          onclick: () => {
            this.app.assets.clearMemoryCache();
            this.app.logger.warn('[AssetManager] Cleared memory image cache');
            this.app.renderAssetLab();
          }
        }, 'Purge Memory Cache')
      ])
    ]);

    // Register Custom Asset Card
    const registerCard = createElement('div', {
      className: 'p-4 sm:p-5 rounded-xl border space-y-3 w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('h3', { className: 'text-sm sm:text-base font-bold' }, 'Register New Asset to Pipeline:'),
      createElement('div', { className: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 w-full min-w-0' }, [
        createElement('input', {
          id: 'new-asset-name',
          type: 'text',
          placeholder: 'Key (e.g. hero_image)',
          className: 'w-full min-w-0 px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
          style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
        }),
        createElement('input', {
          id: 'new-asset-url',
          type: 'text',
          placeholder: 'URL / Path (e.g. /src/assets/...)',
          className: 'w-full min-w-0 px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
          style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
        }),
        createElement('input', {
          id: 'new-asset-title',
          type: 'text',
          placeholder: 'Title / Alt Description',
          className: 'w-full min-w-0 px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
          style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
        }),
        createElement('button', {
          className: 'px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-all shadow-sm shrink-0',
          onclick: () => {
            const name = querySelector('#new-asset-name')?.value.trim();
            const url = querySelector('#new-asset-url')?.value.trim();
            const title = querySelector('#new-asset-title')?.value.trim() || name;

            if (name && url) {
              this.app.assets.register(name, url, { title, alt: title, type: 'image' });
              this.app.logger.info(`[AssetManager] Registered new asset "${name}"`);
              this.app.renderAssetLab();
            }
          }
        }, '+ Register Asset')
      ])
    ]);

    // Primary Filter Card: Icons, Avatars, Logos, Banners, All
    const filterCard = createElement('div', {
      className: 'p-4 rounded-xl border space-y-3 w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    });

    const mainTabs = [
      { id: 'all', label: '⚡ All Assets', count: this.app.assets.count },
      { id: 'icons', label: '🧭 Icon Assets', count: 65 },
      { id: 'avatar', label: '👤 Avatar Assets', count: 1 },
      { id: 'logo', label: '🌟 Logo Assets', count: 1 },
      { id: 'banner', label: '🖼️ Banner Assets', count: 1 }
    ];

    const mainTabBar = createElement('div', { className: 'flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 w-full min-w-0' }, [
      createElement('div', { className: 'flex flex-wrap gap-1.5 sm:gap-2' },
        mainTabs.map(tab => {
          const isActive = this.mainFilter === tab.id;
          return createElement('button', {
            className: `px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isActive
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/90 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
            }`,
            onclick: () => {
              this.mainFilter = tab.id;
              this.app._assetMainFilter = tab.id;
              this.app.renderAssetLab();
            }
          }, [
            createElement('span', {}, tab.label),
            createElement('span', {
              className: `px-1.5 py-0.5 rounded text-[10px] font-mono ${isActive ? 'bg-indigo-800/90 text-indigo-100' : 'bg-slate-900 text-slate-400'}`
            }, `${tab.count}`)
          ]);
        })
      ),
      createElement('input', {
        id: 'asset-search-input',
        type: 'text',
        value: this.searchQuery,
        placeholder: '🔍 Search assets / icons...',
        className: 'w-full md:w-64 px-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-indigo-500 font-mono',
        style: { backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' },
        oninput: (e) => {
          this.searchQuery = e.target.value.toLowerCase().trim();
          this.app._assetSearchQuery = this.searchQuery;
          this.app.renderAssetLab();
        }
      })
    ]);

    filterCard.appendChild(mainTabBar);

    // Icon Subcategories
    if (this.mainFilter === 'icons' || this.mainFilter === 'all') {
      const iconCategories = [
        { id: 'all', label: 'All 65 Icons' },
        { id: 'Navigation & Basic UI', label: '🧭 Navigation (15)' },
        { id: 'User & Profile', label: '👤 User (8)' },
        { id: 'Commerce & Data', label: '📦 Commerce & Data (10)' },
        { id: 'Notification & Communication', label: '🔔 Notification (10)' },
        { id: 'File & Document', label: '📁 File & Docs (8)' },
        { id: 'System & Tools', label: '⚙️ System & Tools (10)' },
        { id: 'Media & Social', label: '🎨 Media & Social (5)' }
      ];

      const subChipsWrapper = createElement('div', {
        className: 'pt-2.5 border-t flex flex-wrap items-center gap-1.5 w-full min-w-0',
        style: { borderColor: 'var(--border-color)' }
      }, [
        createElement('span', { className: 'text-[11px] font-mono text-slate-400 mr-1' }, 'Icon Group:'),
        ...iconCategories.map(cat => {
          const isActive = this.iconSubFilter === cat.id;
          return createElement('button', {
            className: `px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              isActive
                ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`,
            onclick: () => {
              this.iconSubFilter = cat.id;
              this.app._assetIconSubFilter = cat.id;
              this.app.renderAssetLab();
            }
          }, cat.label);
        })
      ]);

      filterCard.appendChild(subChipsWrapper);
    }

    // Filter Assets logic
    const allAssets = this.app.assets.getAll();
    const filteredAssets = allAssets.filter(asset => {
      const isIcon = asset.tags.includes('icon') || asset.kind === 'icon';
      const kind = asset.kind || (isIcon ? 'icon' : (asset.metadata?.kind || (asset.name.includes('logo') ? 'logo' : asset.name.includes('avatar') ? 'avatar' : 'banner')));
      const cat = asset.metadata?.category || '';

      if (this.mainFilter === 'icons' && !isIcon) return false;
      if (this.mainFilter === 'logo' && kind !== 'logo') return false;
      if (this.mainFilter === 'avatar' && kind !== 'avatar') return false;
      if (this.mainFilter === 'banner' && kind !== 'banner') return false;

      if (isIcon && this.iconSubFilter !== 'all' && cat !== this.iconSubFilter) {
        return false;
      }

      if (this.searchQuery) {
        const matchName = asset.name.toLowerCase().includes(this.searchQuery);
        const matchTitle = (asset.title || '').toLowerCase().includes(this.searchQuery);
        const matchAlt = (asset.alt || '').toLowerCase().includes(this.searchQuery);
        const matchCat = (cat || '').toLowerCase().includes(this.searchQuery);
        const matchKind = (kind || '').toLowerCase().includes(this.searchQuery);
        return matchName || matchTitle || matchAlt || matchCat || matchKind;
      }

      return true;
    });

    const categoryTitleMap = {
      all: '⚡ All Registered Assets & Icons',
      icons: '🧭 65-Icon Modular Ecosystem',
      avatar: '👤 Avatar & Profile Assets',
      logo: '🌟 Logo & Brand Identity Assets',
      banner: '🖼️ Banner & Architecture Graphics'
    };

    const galleryHeading = createElement('div', { className: 'flex flex-col sm:flex-row sm:items-center justify-between gap-1 pt-2 w-full min-w-0' }, [
      createElement('h3', { className: 'text-base sm:text-lg font-bold flex items-center gap-2' }, [
        createElement('span', {}, this.mainFilter === 'avatar' ? '👤' : this.mainFilter === 'logo' ? '🌟' : this.mainFilter === 'banner' ? '🖼️' : '🧭'),
        createElement('span', {}, categoryTitleMap[this.mainFilter] || 'Asset Catalog')
      ]),
      createElement('span', { className: 'text-xs text-slate-400 font-mono' }, `Showing ${filteredAssets.length} item(s)`)
    ]);

    const isGridDense = this.mainFilter === 'icons' || (this.mainFilter === 'all' && filteredAssets.length > 5);
    const galleryGrid = createElement('div', {
      className: isGridDense
        ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 w-full min-w-0'
        : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 w-full min-w-0'
    });

    filteredAssets.forEach(asset => {
      const key = asset.name;
      const isLoaded = this.app.assets.isLoaded(key);
      const fullUrl = asset.url;
      const isIcon = asset.tags.includes('icon') || asset.kind === 'icon';
      const kind = asset.kind || (isIcon ? 'icon' : (asset.metadata?.kind || (asset.name.includes('logo') ? 'logo' : asset.name.includes('avatar') ? 'avatar' : 'banner')));
      const iconId = asset.metadata?.iconId;

      const card = createElement('div', {
        className: 'rounded-xl border overflow-hidden flex flex-col justify-between group transition-all hover:border-indigo-500/50 shadow-sm p-3 gap-3 w-full min-w-0',
        style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
      });

      const previewWrapper = createElement('div', {
        className: `relative w-full ${
          isIcon ? 'h-24' : kind === 'banner' ? 'h-36 sm:h-40' : 'h-32 sm:h-36'
        } bg-slate-950/80 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800/80 p-2.5`
      });

      let imgClass = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300';
      if (isIcon) {
        imgClass = 'w-9 h-9 sm:w-10 sm:h-10 object-contain filter invert opacity-90 group-hover:scale-110 transition-transform duration-200';
      } else if (kind === 'avatar') {
        imgClass = 'w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-indigo-500/40 shadow-lg group-hover:scale-105 transition-transform duration-300';
      } else if (kind === 'logo') {
        imgClass = 'w-20 h-20 sm:w-24 sm:h-24 object-contain rounded-xl p-2 bg-slate-900 border border-slate-700/50 group-hover:scale-105 transition-transform duration-300';
      }

      const img = createElement('img', {
        src: fullUrl,
        alt: asset.alt || key,
        className: imgClass,
        loading: 'lazy'
      });
      img.referrerPolicy = 'no-referrer';

      const tagBadge = createElement('div', {
        className: 'absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] font-mono text-indigo-300 border border-indigo-500/30'
      }, isIcon ? `#${iconId}` : kind === 'avatar' ? 'AVATAR' : kind === 'logo' ? 'LOGO' : 'BANNER');

      const cacheBadge = createElement('div', {
        className: `absolute top-2 right-2 px-1.5 py-0.5 rounded backdrop-blur-md text-[9px] font-mono border ${
          isLoaded
            ? 'bg-emerald-950/90 text-emerald-400 border-emerald-500/40'
            : 'bg-slate-900/90 text-slate-400 border-slate-700/40'
        }`
      }, isLoaded ? '● Ready' : '○ Standby');

      previewWrapper.appendChild(img);
      previewWrapper.appendChild(tagBadge);
      previewWrapper.appendChild(cacheBadge);

      const body = createElement('div', { className: 'space-y-1.5 flex-1 flex flex-col justify-between min-w-0' }, [
        createElement('div', { className: 'space-y-0.5 min-w-0' }, [
          createElement('h4', { className: 'font-bold text-xs text-slate-100 group-hover:text-indigo-400 transition-colors truncate' }, asset.title || key),
          createElement('p', { className: 'text-[10px] sm:text-[11px] font-mono text-indigo-300/80 truncate' }, key),
          createElement('p', { className: 'text-[10px] text-slate-400 truncate' }, asset.metadata?.category || 'Visual Asset')
        ]),
        createElement('div', { className: 'pt-2 border-t flex items-center justify-between gap-1.5', style: { borderColor: 'var(--border-color)' } }, [
          createElement('button', {
            className: 'flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] sm:text-[11px] font-medium transition-all text-center',
            onclick: async () => {
              try {
                await this.app.assets.load(key);
                this.app.logger.info(`[AssetManager] Loaded "${key}"`);
                this.app.renderAssetLab();
              } catch (e) {
                this.app.logger.error(`[AssetManager] Failed to load "${key}": ${e.message}`);
              }
            }
          }, isLoaded ? '✓ In Memory' : '⚡ Load'),
          createElement('button', {
            className: 'px-2 py-1 rounded border border-slate-700 hover:bg-slate-800 text-[10px] sm:text-[11px] font-mono text-indigo-400 transition-all shrink-0',
            title: 'Copy import statement / key',
            onclick: (e) => {
              const snippet = isIcon
                ? `import { ${key.replace(/-/g, '_')} } from 'vexorion/icons/${key}.js';`
                : `assets.get('${key}')`;
              if (navigator.clipboard) {
                navigator.clipboard.writeText(snippet);
                e.target.textContent = 'Copied!';
                setTimeout(() => { e.target.textContent = 'Copy'; }, 1500);
              }
            }
          }, 'Copy')
        ])
      ]);

      card.appendChild(previewWrapper);
      card.appendChild(body);
      galleryGrid.appendChild(card);
    });

    if (filteredAssets.length === 0) {
      const emptyState = createElement('div', {
        className: 'col-span-full py-12 text-center text-slate-400 font-mono text-xs border border-dashed rounded-xl',
        style: { borderColor: 'var(--border-color)' }
      }, `No assets or icons found matching category and search filter.`);
      galleryGrid.appendChild(emptyState);
    }

    // Integration Code Card
    const codeSnippet = `// 1. Initialize AssetManager in your Vexorion application
import { AssetManager } from 'vexorion';

const assets = new AssetManager({
  assets: {
    'logo': { url: '/src/assets/images/vexorion_logo.jpg', alt: 'Vexorion Logo', tags: ['branding'] },
    'hero': { url: '/src/assets/images/hero_banner.jpg', alt: 'Hero Banner', tags: ['hero'] }
  }
});

// 2. Preload assets asynchronously
await assets.preloadAll();

// 3. Create reactive Image DOM elements automatically
const logoElement = assets.createImageElement('logo', {
  className: 'w-10 h-10 rounded-lg shadow-md'
});
document.body.appendChild(logoElement);

// 4. Retrieve cached resolved URL or inspect metadata
const url = assets.getUrl('logo');
const meta = assets.getMeta('logo');`;

    const codeCard = createElement('div', {
      className: 'p-4 sm:p-5 rounded-xl border space-y-2 w-full min-w-0',
      style: { backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }
    }, [
      createElement('div', { className: 'flex items-center justify-between' }, [
        createElement('span', { className: 'text-xs font-mono font-bold text-indigo-400' }, 'ASSETMANAGER INTEGRATION PATTERN'),
        createElement('span', { className: 'text-xs text-slate-400' }, 'ES Module Syntax')
      ]),
      createElement('pre', {
        className: 'p-3 sm:p-4 rounded-lg bg-slate-950 text-indigo-300 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-w-full'
      }, codeSnippet)
    ]);

    container.appendChild(header);
    container.appendChild(statsBar);
    container.appendChild(progressBarWrapper);
    container.appendChild(actionsCard);
    container.appendChild(registerCard);
    container.appendChild(filterCard);
    container.appendChild(galleryHeading);
    container.appendChild(galleryGrid);
    container.appendChild(codeCard);

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

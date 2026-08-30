// ============================================================
//  INDEX.JS - Entry Point
//  Complete Vexorion Framework Export
// ============================================================

// ===== CORE MODULES =====
export * from './core/Browser.js';
export * from './core/Misc.js';
export * from './core/Dom.js';
export * from './core/Typedefs.js';

// ===== CLASS MODULES =====
export { EventEmitter } from './classes/EventEmitter.js';
export { StringStream } from './classes/StringStream.js';
export { Bidirectional } from './classes/Bidirectional.js';
export { OperationGroup } from './classes/OperationGroup.js';
export { StateManager } from './classes/StateManager.js';
export { CacheManager } from './classes/CacheManager.js';
export { Logger } from './classes/Logger.js';
export { Validator } from './classes/Validator.js';
export { Router } from './classes/Router.js';
export { Store } from './classes/Store.js';

// ===== MODE MODULES =====
export { Mode } from './modes/Mode.js';
export { DarkMode } from './modes/DarkMode.js';
export { LightMode } from './modes/LightMode.js';
export { AccessibilityMode } from './modes/AccessibilityMode.js';
export { CompactMode } from './modes/CompactMode.js';
export { DeveloperMode } from './modes/DeveloperMode.js';

// ===== PLUGIN MODULES =====
export { PluginSystem } from './plugins/PluginSystem.js';
export { Middleware } from './plugins/Middleware.js';
export { Hooks } from './plugins/Hooks.js';

// ===== DEFAULT EXPORT =====
import * as Browser from './core/Browser.js';
import * as Misc from './core/Misc.js';
import * as Dom from './core/Dom.js';
import * as Classes from './classes/index.js';
import * as Modes from './modes/index.js';
import * as Plugins from './plugins/index.js';

export default {
  Browser,
  Misc,
  Dom,
  Classes,
  Modes,
  Plugins
};

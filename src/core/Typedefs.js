/**
 * @typedef {Object} VexorionEngineFlags
 * @property {boolean} gecko - Gecko engine.
 * @property {boolean} webkit - WebKit engine.
 * @property {boolean} presto - Presto engine.
 * @property {RegExpExecArray|null} chrome - Chrome match.
 * @property {number|null} chromeVersion - Chrome version.
 */

/**
 * @typedef {Object} VexorionBrowserFlags
 * @property {boolean} ie - Internet Explorer/Edge.
 * @property {number|boolean} ieVersion - IE version.
 * @property {boolean} safari - Safari browser.
 * @property {boolean} phantom - PhantomJS.
 */

/**
 * @typedef {Object} VexorionPlatformFlags
 * @property {boolean} ios - iOS platform.
 * @property {boolean} android - Android platform.
 * @property {boolean} mobile - Mobile device.
 * @property {boolean} mac - macOS.
 * @property {boolean} chromeOS - Chrome OS.
 * @property {boolean} windows - Windows.
 * @property {boolean} macGeMountainLion - macOS 10.8+.
 */

/**
 * @typedef {Object} VexorionFeatureFlags
 * @property {boolean} flipCtrlCmd - Flip Ctrl/Cmd on macOS.
 * @property {boolean} captureRightClick - Capture right click.
 */

/**
 * @typedef {Object} VexorionAllFlags
 * @property {VexorionEngineFlags} engine - Engine flags.
 * @property {VexorionBrowserFlags} browser - Browser flags.
 * @property {VexorionPlatformFlags} platform - Platform flags.
 * @property {VexorionFeatureFlags} features - Feature flags.
 */

/**
 * @typedef {Object} BrowserDetectionResult
 * @property {string} userAgent - Raw userAgent.
 * @property {string} platform - Raw platform.
 * @property {VexorionAllFlags} flags - All flags.
 */

/**
 * @typedef {Object} EventListener
 * @property {string} event - Event name.
 * @property {Function} callback - Callback function.
 * @property {Object|null} context - Context object.
 * @property {boolean} once - One-time listener.
 */

/**
 * @typedef {Object} StreamOptions
 * @property {boolean} buffer - Buffer enabled.
 * @property {number} maxSize - Maximum buffer size.
 * @property {string} encoding - Encoding type.
 */

/**
 * @typedef {Object} BindingOptions
 * @property {boolean} twoWay - Two-way binding.
 * @property {boolean} immediate - Immediate update.
 * @property {Function} transform - Transform function.
 */

/**
 * @typedef {Object} Operation
 * @property {string} id - Operation ID.
 * @property {string} name - Operation name.
 * @property {Function} execute - Execute function.
 * @property {Function} undo - Undo function.
 * @property {Object} metadata - Metadata.
 * @property {number} timestamp - Creation timestamp.
 */

// ===== EXPORT =====
export {};

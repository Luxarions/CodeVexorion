// ===== VARIABLES =====
const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const platform = typeof navigator !== 'undefined' ? navigator.platform : '';

const ieUpTo10 = /MSIE \d/.test(userAgent);
const ie11UpMatch = /Trident\/(?:[7-9]|\d{2,})\..*rv:(\d+)/.exec(userAgent);
const edgeMatch = /Edge\/(\d+)/.exec(userAgent);

// ===== ENGINE =====
const gecko = /gecko\/\d/i.test(userAgent);
let webkit = !edgeMatch && /WebKit\//.test(userAgent);
let presto = /Opera\//.test(userAgent);
const chrome = !edgeMatch && /Chrome\/(\d+)/.exec(userAgent);
const chromeVersion = chrome && +chrome[1];

// ===== INTERNAL =====
const qtWebkit = webkit && /Qt\/\d+\.\d+/.test(userAgent);
let prestoVersion = presto && userAgent.match(/Version\/(\d*\.\d*)/);

if (prestoVersion) {
  prestoVersion = Number(prestoVersion[1]);
}
if (prestoVersion && prestoVersion >= 15) {
  presto = false;
  webkit = true;
}

// ===== BROWSER =====
const ie = ieUpTo10 || ie11UpMatch || edgeMatch;
const ieVersion = ie && (ieUpTo10 ? (typeof document !== 'undefined' && document.documentMode ? document.documentMode : 6) : +(edgeMatch || ie11UpMatch)[1]);
const safari = typeof navigator !== 'undefined' && /Apple Computer/.test(navigator.vendor);
const phantom = /PhantomJS/.test(userAgent);

// ===== PLATFORM =====
const ios = safari && (/Mobile\/\w+/.test(userAgent) || (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 2));
const android = /Android/.test(userAgent);
const mobile = ios || android || /webOS|BlackBerry|Opera Mini|Opera Mobi|IEMobile/i.test(userAgent);
const mac = ios || /Mac/.test(platform);
const chromeOS = /\bCrOS\b/.test(userAgent);
const windows = /win/i.test(platform);
const macGeMountainLion = /Mac OS X 1\d\D([8-9]|\d\d)\D/.test(userAgent);

// ===== FEATURES =====
const flipCtrlCmd = mac && (qtWebkit || (presto && (prestoVersion == null || prestoVersion < 12.11)));
const captureRightClick = gecko || (ie && ieVersion >= 9);

// ===== FUNCTIONS =====
function getAllEngineFlags() {
  return {
    gecko,
    webkit,
    presto,
    chrome,
    chromeVersion
  };
}

function getAllBrowserFlags() {
  return {
    ie,
    ieVersion,
    safari,
    phantom
  };
}

function getAllPlatformFlags() {
  return {
    ios,
    android,
    mobile,
    mac,
    chromeOS,
    windows,
    macGeMountainLion
  };
}

function getAllFeatureFlags() {
  return {
    flipCtrlCmd,
    captureRightClick
  };
}

function getAllFlags() {
  return {
    engine: getAllEngineFlags(),
    browser: getAllBrowserFlags(),
    platform: getAllPlatformFlags(),
    features: getAllFeatureFlags()
  };
}

function getDetectionResult() {
  return {
    userAgent,
    platform,
    flags: getAllFlags()
  };
}

function getFlatFlags() {
  const flags = getAllFlags();
  return {
    ...flags.engine,
    ...flags.browser,
    ...flags.platform,
    ...flags.features
  };
}

// ===== EXPORT DI AKHIR =====
export {
  gecko,
  webkit,
  presto,
  chrome,
  chromeVersion,
  ie,
  ieVersion,
  safari,
  phantom,
  ios,
  android,
  mobile,
  mac,
  chromeOS,
  windows,
  macGeMountainLion,
  flipCtrlCmd,
  captureRightClick,
  getAllEngineFlags,
  getAllBrowserFlags,
  getAllPlatformFlags,
  getAllFeatureFlags,
  getAllFlags,
  getDetectionResult,
  getFlatFlags
};

const { createRunOncePlugin } = require('expo/config-plugins');

/**
 * No-op plugin that indicates Hermes is enabled via `jsEngine` in app.json.
 * This avoids "Failed to resolve plugin" errors when the file is referenced.
 */
const withHermesEnabled = (config) => {
  // Nothing to change — app.json already contains "jsEngine": "hermes".
  return config;
};

module.exports = createRunOncePlugin(withHermesEnabled, 'withHermesEnabled', '1.0.0');

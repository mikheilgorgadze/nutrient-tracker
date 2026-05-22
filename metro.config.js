const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow bundling binary SQLite DB files shipped in assets/
config.resolver.assetExts.push('db');

const NODE_BUILTINS = new Set([
  'node:fs', 'node:path', 'node:os', 'node:crypto', 'node:util',
  'node:stream', 'node:events', 'node:buffer', 'node:url', 'node:http',
  'node:https', 'node:net', 'node:tls', 'node:child_process', 'node:process',
  'node:assert', 'node:zlib', 'node:dns', 'node:readline',
  'fs', 'path', 'os', 'crypto', 'util', 'stream', 'events',
  'url', 'http', 'https', 'net', 'tls', 'child_process', 'assert', 'zlib',
]);

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (NODE_BUILTINS.has(moduleName)) {
    return {
      filePath: require.resolve('./src/shims/empty-module.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Enable extra node modules resolution mapping for pnpm virtual store
config.resolver.extraNodeModules = new Proxy({}, {
  get: (target, name) => {
    try {
      return path.dirname(require.resolve(`${name}/package.json`, { paths: [projectRoot, workspaceRoot] }));
    } catch (e) {
      return path.join(projectRoot, 'node_modules', name);
    }
  }
});

// 4. @supabase/supabase-js dynamically imports @opentelemetry/api for optional
// tracing; Metro (unlike Vite/webpack) tries to statically resolve it and
// fails the bundle since it's not installed. Stub it out — see stubs/opentelemetry-api-stub.js.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@opentelemetry/api') {
    return { filePath: path.resolve(projectRoot, 'stubs/opentelemetry-api-stub.js'), type: 'sourceFile' };
  }
  return originalResolveRequest
    ? originalResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

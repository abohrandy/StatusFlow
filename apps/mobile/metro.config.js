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

module.exports = config;

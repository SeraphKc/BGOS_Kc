const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    extraNodeModules: {
      '@bgos/shared-types': path.resolve(workspaceRoot, 'packages/shared-types/src'),
      '@bgos/shared-logic': path.resolve(workspaceRoot, 'packages/shared-logic/src'),
      '@bgos/shared-services': path.resolve(workspaceRoot, 'packages/shared-services/src'),
      '@bgos/shared-state': path.resolve(workspaceRoot, 'packages/shared-state/src'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);

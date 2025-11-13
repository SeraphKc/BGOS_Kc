const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(workspaceRoot, 'node_modules'),
    ],
    extraNodeModules: {
      '@bgos/shared-types': path.resolve(workspaceRoot, 'packages/shared-types/dist'),
      '@bgos/shared-logic': path.resolve(workspaceRoot, 'packages/shared-logic/dist'),
      '@bgos/shared-services': path.resolve(workspaceRoot, 'packages/shared-services/dist'),
      '@bgos/shared-state': path.resolve(workspaceRoot, 'packages/shared-state/dist'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);

module.exports = {
  module: {
    rules: require('./webpack.rules').filter(rule => {
      // Exclude the asset-relocator-loader from preload scripts
      // as it injects __dirname which is not available in preload context
      if (rule.use) {
        let loaderName;

        // Handle string format
        if (typeof rule.use === 'string') {
          loaderName = rule.use;
        }
        // Handle object format with loader property
        else if (rule.use.loader) {
          loaderName = rule.use.loader;
        }
        // Handle array format
        else if (Array.isArray(rule.use)) {
          loaderName = rule.use.find(u =>
            (typeof u === 'string' && u.includes('@vercel/webpack-asset-relocator-loader')) ||
            (u.loader && u.loader.includes('@vercel/webpack-asset-relocator-loader'))
          );
        }

        if (loaderName && loaderName.includes && loaderName.includes('@vercel/webpack-asset-relocator-loader')) {
          return false; // Exclude this rule
        }
      }
      return true; // Keep all other rules
    }),
  },
  // Critical: Set target to electron-preload to handle Node.js globals correctly
  target: 'electron-preload',
  // Keep electron external to avoid bundling it
  externals: {
    electron: 'commonjs electron',
  },
  // Configure Node.js globals - disable __dirname and __filename
  // as they are not available in the sandboxed preload context
  node: {
    __dirname: false,
    __filename: false,
  },
  output: {
    globalObject: 'this',
  },
};

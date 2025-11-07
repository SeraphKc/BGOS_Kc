const rules = require('./webpack.rules');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Filter out asset relocator loader for renderer (causes __dirname errors)
const filteredRules = rules.filter(rule => {
  if (rule.use) {
    let loaderName;
    if (typeof rule.use === 'string') {
      loaderName = rule.use;
    } else if (rule.use.loader) {
      loaderName = rule.use.loader;
    } else if (Array.isArray(rule.use)) {
      loaderName = rule.use.find(u =>
        (typeof u === 'string' && u.includes('@vercel/webpack-asset-relocator-loader')) ||
        (u.loader && u.loader.includes('@vercel/webpack-asset-relocator-loader'))
      );
    }
    if (loaderName && loaderName.includes && loaderName.includes('@vercel/webpack-asset-relocator-loader')) {
      return false;
    }
  }
  return true;
});

filteredRules.push({
  test: /\.css$/i,
  use: ['style-loader', 'css-loader', 'postcss-loader'],
});

module.exports = {
  entry: './src/renderer.tsx',
  module: {
    rules: filteredRules,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  // Disable Node.js globals in renderer
  node: {
    __dirname: false,
    __filename: false,
  },
  plugins: [
    new HtmlWebpackPlugin({
      templateContent: `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy"
              content="default-src 'self' blob:; 
                       connect-src * data: blob:; 
                       script-src 'self' 'unsafe-eval'; 
                       style-src 'self' 'unsafe-inline'; 
                       img-src 'self' data: blob:; 
                       media-src 'self' blob:;">
        <title>AVA Desktop</title>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `,
    }),
  ],
};

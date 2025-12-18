const path = require('path');

module.exports = {
  target: 'node',
  mode: 'none',
  entry: {
    extension: './src/extension.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs',
    devtoolModuleFilenameTemplate: '../../[resource-path]'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    mainFields: ['module', 'main']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  externals: {
    'vscode': 'commonjs vscode'
  },
  devtool: 'nosources-source-map'
};

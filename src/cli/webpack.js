import path from 'path';
import webpack from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

/**
 * @callback WebpackFunction
 * @param {import('./webpack').WebpackOptions} options
 * @returns {Promise<import('webpack').Configuration>}
 */

/** @type {WebpackFunction} */
const BASE_WEBPACK_TEMPLATE = async (opts) => ({
  context: opts.cmsSrcDir,
  mode: opts.mode,
  output: {
    clean: true,
    filename: 'main.js',
    chunkFilename: '[name].[contenthash].js'
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.sass'],
    modules: ['node_modules']
  },
  module: {
    rules: [{
      test: /\.(j|t)sx?$/,
      loader: 'babel-loader',
      options: {
        presets: [
          '@babel/preset-env',
          '@babel/preset-react',
          '@babel/preset-typescript'
        ]
      }
    }, {
      test: /\.css$/,
      use: [
        MiniCssExtractPlugin.loader,
        'css-loader',
        {
          loader: 'postcss-loader',
          options: {
            postcssOptions: {
              plugins: [
                'autoprefixer'
              ]
            }
          }
        }
      ]
    }, {
      test: /\.png$/,
      type: 'asset/resource'
    }]
  },
  ignoreWarnings: [() => true],
  optimization: {
    splitChunks: {
      hidePathInfo: true,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          enforce: true,
          name: 'vendor',
          filename: '[name].[contenthash].js',
          reuseExistingChunk: true
        }
      },
      maxSize: 50000
    },
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin()
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css'
    }),
    new webpack.ProvidePlugin({
      React: 'react'
    }),
    new webpack.DefinePlugin({
      __SNOWCMS_CONFIG_FILE__: JSON.stringify(opts.configPath),
      __SNOWCMS_PLUGIN_CONFIG_FILE__: opts.pluginConfigPath &&
        JSON.stringify(opts.pluginConfigPath),
      __SNOWCMS_IS_PRODUCTION__: opts.mode === 'production'
    })
  ]
});

// TODO: Figure out dev server
// Possibly have the `snowcms dev` command run webpack.watch and restart the Express server whenever there's a change?
// Then have the client config proxy to the server. Also, only use express.static in production builds.
// WebPack ignores devServer property when called through the API, so need to pass the devServer config to the API.

/** @type {WebpackFunction} */
export async function getWebpackServerConfig(opts) {
  const baseConfig = await BASE_WEBPACK_TEMPLATE(opts);
  return {
    ...baseConfig,
    target: 'node',
    entry: './src/server/index.ts',
    output: {
      ...baseConfig.output,
      path: path.join(opts.userDir, 'dist', 'server'),
      module: true,
      chunkFormat: 'module'
    },
    externalsPresets: {
      node: true
    },
    experiments: {
      outputModule: true
    },
    /*
     * Dependencies that can be run by Node without
     * being built don't need to be included in
     * the bundle. Only React components and libraries
     * need to be included in the bundle.
     */
    externals: [
      'express'
    ]
  };
}

/** @type {WebpackFunction} */
export async function getWebpackClientConfig(opts) {
  const baseConfig = await BASE_WEBPACK_TEMPLATE(opts);
  return {
    ...baseConfig,
    entry: './src/client/index.ts',
    output: {
      ...baseConfig.output,
      path: path.join(opts.userDir, 'dist', 'client'),
      publicPath: '/assets/'
    },
    devServer: {
      port: 3081,
      // HMR doesn't work with module chunks
      hot: false,
      proxy: [{
        context: () => true,
        target: 'http://localhost:3080'
      }],
      static: false,
      client: {
        overlay: true
      }
    }
  };
}

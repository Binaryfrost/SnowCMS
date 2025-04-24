import path from 'path';
import webpack from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import { exists } from './util.js';

/**
 * @callback WebpackFunction
 * @param {import('./webpack').WebpackOptions} options
 * @returns {Promise<import('webpack').Configuration>}
 */

const SERVER_DIST = (dir) => path.join(dir, 'dist', 'server');
const CLIENT_DIST = (dir) => path.join(dir, 'dist', 'client');

const CLIENT_PUBLIC_PATH = process.env.CLIENT_PUBLIC_PATH?.includes('://') &&
  process.env.CLIENT_PUBLIC_PATH;

/**
 * @param {string} userDir
 * @param {import('../common/plugins/plugins').PluginTypes} type
 */
async function pluginConfig(userDir, type) {
  const configFile = path.join(userDir, 'src', type, `${type}.config.ts`);
  return await exists(configFile) && JSON.stringify(configFile);
}

/** @type {WebpackFunction} */
const BASE_WEBPACK_TEMPLATE = async (opts) => ({
  context: opts.cmsSrcDir,
  mode: opts.mode,
  output: {
    clean: true,
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
  optimization: {
    splitChunks: {
      hidePathInfo: true,
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
      __SNOWCMS_CONFIG_FILE__: JSON.stringify(path.join(opts.userDir, 'snowcms.config.ts')),
      __SNOWCMS_INPUTS_PLUGIN_CONFIG__: await pluginConfig(opts.userDir, 'inputs'),
      __SNOWCMS_HOOKS_PLUGIN_CONFIG__: await pluginConfig(opts.userDir, 'hooks'),
      __SNOWCMS_ROUTES_PLUGIN_CONFIG__: await pluginConfig(opts.userDir, 'routes'),
      __SNOWCMS_IS_PRODUCTION__: opts.mode === 'production',
      __SNOWCMS_CLIENT_PUBLIC_PATH__: CLIENT_PUBLIC_PATH && JSON.stringify(CLIENT_PUBLIC_PATH)
    })
  ]
});

/** @type {WebpackFunction} */
export async function getWebpackServerConfig(opts) {
  const baseConfig = await BASE_WEBPACK_TEMPLATE(opts);
  return {
    ...baseConfig,
    target: 'node',
    entry: './src/server/index.ts',
    output: {
      ...baseConfig.output,
      path: SERVER_DIST(opts.userDir),
      module: true,
      filename: 'server.js',
      chunkFormat: 'module'
    },
    externalsPresets: {
      node: true
    },
    experiments: {
      outputModule: true
    },
    /*
     * Dependencies that can be run by Node without being built don't need to be included in
     * the bundle as they can be copied to the dist directory after compilation.
     * Only React components and libraries need to be included in the bundle.
     */
    externals: [
      'express',
      'knex',
      'mysql2',
      'bcrypt',
      '@aws-sdk/client-s3',
      '@aws-sdk/s3-request-presigner',
      'redis'
    ],
    plugins: [
      ...baseConfig.plugins,
      new CopyPlugin({
        patterns: [{
          from: path.join(opts.cmsSrcDir, 'src', 'cli', 'server-package.json'),
          to: 'package.json'
        }]
      })
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
      path: CLIENT_DIST(opts.userDir),
      publicPath: CLIENT_PUBLIC_PATH || '/assets/',
      filename: 'main.[contenthash].js'
    },
    plugins: [
      ...baseConfig.plugins,
      new WebpackManifestPlugin()
    ]
  };
}

const ArcGISPlugin = require('@arcgis/webpack-plugin');
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const path = require("path");

module.exports = function(_, args) {
  const mode = args.mode;

  const config = {
    entry: {
      index: [
        "./src/index.scss",
        "@babel/polyfill",
        "./src/index.ts"
      ]
    },
    output: {
      filename: "[name].[chunkhash].js",
      publicPath: "/"
    },
    // Optimize output in production only.
    optimization: {
      minimize: mode === 'production',
      splitChunks: { minChunks: Infinity, chunks: 'all' },
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            output: {
              comments: false,
            },
          },
        }),
        new CssMinimizerPlugin(),
      ],
      runtimeChunk: {
        name: 'runtime',
      },
    },
    module: {
      rules: [
        {
          test: /\.(ts|js)x?$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
        },
        {
          test: /\.tsx?$/,
          loader: "ts-loader",
          options: {
            transpileOnly: true
          }
        },
        {
          test: /\.html$/,
          use: [
            {
              loader: "html-loader",
              options: { minimize: false }
            }
          ],
          exclude: /node_modules/
        },
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                sourceMap: true,
                url: false,
                importLoaders: 2,
              },
            },
            {
              loader: "resolve-url-loader",
              options: {
                sourceMap: true,
                debug: mode === 'development',
                join: (_rul_uri, _rul_base) => {
                  // args must be included
                  return (assetPath, absolutePath) => {
                    // ArcGISPlugin copies assets and cannot be resolved when using api sass
                    // replace relative path with absolute path in `dist` so files can be found for resolving
                    return absolutePath.includes('@arcgis/core')
                      ? assetPath.replace('../', './assets/esri/themes/')
                      : assetPath;
                  };
                },
              },
            },
            {
              loader: "sass-loader",
              options: {
                sourceMap: true,
                // Prefer `dart-sass`
                implementation: require("sass"),
              },
            },
          ]
        },
        {
          test: /\.(png|jpg|gif|ttf|woff|woff2|svg)$/,
          use: [
            {
              loader: "file-loader",
              options: {}
            }
          ]
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin(),

      new ArcGISPlugin({ locales: ['fr, en'] }),

      new HtmlWebPackPlugin({
        title: "Webpack 5 & arcgis/core",
        template: "./src/index.ejs",
        filename: "./index.html",
        chunks: ["index"],
        chunksSortMode: "none",
        inlineSource: ".(css)$",
        mode: args.mode
      }),

      new CopyPlugin({
        patterns: [
          // ESRI assets (images, t9n, wasm...)
          {
            context: "node_modules",
            from: "@arcgis/core/assets",
            to: "assets"
          },
          {
            from: "src/assets",
            to: "assets"
          }
        ],
      }),

      new MiniCssExtractPlugin({
        filename: "[name].[chunkhash].css",
        chunkFilename: "[id].css"
      })
    ],
    resolve: {
      modules: [
        path.resolve(__dirname, "/src"),
        path.resolve(__dirname, "node_modules/")
      ],
      extensions: [".ts", ".tsx", ".mjs", ".js", ".scss", ".css"]
    },
    node: {
      global: false
    }
  };

  return config;
};

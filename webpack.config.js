const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  name: 'app',

  entry: {
    font: path.join(__dirname, 'public/css/font.css'),
    emoji: path.join(__dirname, 'public/css/emoji.css'),
    note: [
      path.join(__dirname, 'public/js/note.js'),
    ],
    menu: [
      path.join(__dirname, 'public/js/menu.js'),
    ],
    'note-style': [
      path.join(__dirname, 'public/css/font.css'),
      path.join(__dirname, 'public/css/codeMirrorEditor.css'),
      path.join(__dirname, 'public/css/codeMirrorEditorEmbeded.css'),
      path.join(__dirname, 'public/css/proseMirror.css'),
      path.join(__dirname, 'node_modules/bootstrap/dist/css/bootstrap.min.css'),
      path.join(__dirname, 'public/css/note.css'),
    ],
  },

  output: {
    path: path.join(__dirname, 'public/build'),
    publicPath: '/build/',
    filename: '[name].js',
  },

  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
    ],
  },

  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
    }),
    new HtmlWebpackPlugin({
      template: './public/views/includes/head.ejs',
      filename: path.join(__dirname, 'public/views/build/note-head.ejs'),
      chunks: ['font', 'emoji', 'note-style'],
      chunksSortMode: 'manual',
    }),
    new HtmlWebpackPlugin({
      template: './public/views/includes/scripts.ejs',
      filename: path.join(__dirname, 'public/views/build/note-scripts.ejs'),
      chunks: ['menu', 'note'],
      chunksSortMode: 'manual',
    }),
    new MiniCssExtractPlugin(),
  ],
};

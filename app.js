/**
 * Module dependencies
 */

var stack = require('poe-ui/server');
var glob = require('glob').sync;
var Path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

/**
 * Expose the app
 */

var app = module.exports = stack({});
var builder = app.builder;

builder.resolve.modulesDirectories.push('./src');

builder.module.loaders = builder.module.loaders.filter(function(loader) {
  if (!loader.extensions) return true;
  return !~loader.extensions.indexOf('jade');
});

builder.addES6({
  test: /\.(js)$/,
  include: /ui-kit/
});

builder.entry.main = [builder.entry.main];

var SITE_URL = process.env.SITE_URL || 'http://www.mazurka.io';

var pages = __dirname + '/src/modules/pages';
glob(pages + '/**/*.jade').forEach(function(source) {
  page(source);
});

glob(pages + '/**/*.md').forEach(function(source) {
  page(source, '!./lib/jade-frontmatter-loader!yaml-frontmatter-loader');
});

function page(source, loaders) {
  loaders = loaders || '';

  var relative = formatRelativeName(source);

  var plugin = new ExtractTextPlugin(source, relative, {extract: true, remove: true});
  builder.plugins.push(plugin);

  var path = ('/' + relative.replace('index.html', '')).replace(/\/$/, '');

  var opts = {
    url: SITE_URL + path,
    path: path,
    filename: Path.relative(__dirname, source)
  };

  var loader = plugin.extract('html-loader?attrs=img:src *:style&root=' + __dirname + '/src!jade-html-loader?' + JSON.stringify(opts) + loaders);
  builder.module.loaders.push({test: new RegExp(source), loader: loader, loaders: loader});

  builder.entry.main.push(source);
}

builder.output.publicPath = process.env.CDN_URL || '/';

function formatRelativeName(source) {
  var relative = Path.relative(pages, source).replace('.md', '').replace('.jade', '');
  if (relative === 'index' || relative === 'index/index') return 'index.html';
  var filename = relative.split('/').slice(-1)[0];
  if (filename === 'index') return relative + '.html';
  return relative + '/index.html';
}

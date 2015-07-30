var marked = require('marked');
var highlight = require('highlight.js');

module.exports = function(source) {
  this.cacheable && this.cacheable();

  source = JSON.parse(source);
  var locals = source.locals;
  locals = JSON.stringify(Object.keys(source.locals || {}).map(function(key) {
    return [key, locals[key]];
  }));

  var renderer = new marked.Renderer();

  renderer.heading = function(text, level) {
    var escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');

    return '' +
      '<h' + level + '>' +
        '<a id="' + escapedText + '" class="Header-anchor" href="#' + escapedText + '" aria-hidden="true">' +
          '<span class="Header-anchor-icon"></span>' +
        '</a>' +
        text +
      '</h' + level + '>';
  };

  var content = marked(source.__content || '', {
    renderer: renderer,
    gfm: true,
    tables: true,
    breaks: false,
    pedantic: false,
    sanitize: true,
    smartLists: true,
    smartypants: false,
    langPrefix: 'hljs ',
    highlight: function(code) {
      return highlight.highlightAuto(code).value;
    }
  });

  this.addDependency(source.extends);

  return [
    'extends ' + source.extends,
    'append locals',
    '  - ' + locals + '.forEach(function(kv) { locals[kv[0]] = kv[1]});',
    'block ' + (source.block || 'main'),
    '  != ' + JSON.stringify(content),
  ].join('\n');
};

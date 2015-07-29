var indent = require('indent-string');

module.exports = function(source) {
  this.cacheable && this.cacheable();
  source = JSON.parse(source);
  var locals = source.locals;
  locals = JSON.stringify(Object.keys(source.locals || {}).map(function(key) {
    return [key, locals[key]];
  }));
  var out = [
    'extends ' + source.extends,
    'append locals',
    '  - ' + locals + '.forEach(function(kv) { locals[kv[0]] = kv[1]});',
    'block ' + (source.block || 'main'),
    '  :marked',
    indent((source.__content || '').trim(), ' ', 4)
  ].join('\n');
  return out;
};

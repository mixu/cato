function html(el, depth) {
  function whitespace(size) {
    return new Array(size + 1 ).join(' ');
  }
  if(arguments.length == 1) {
    depth = 0;
  }
  if(typeof el === 'string') {
    if(/^\s+$/.test(el)) return '';
    return el;
  }
  var result = '<'+el.tag;

  if(el.attr) {
    result += ' '+Object.keys(el.attr).map(function(key){
                return key + '="'+el.attr[key]+'"';
              }).join(' ');
  }
  if(el.content) {
    result += '>\n';
    if(Array.isArray(el.content)) {
      result += el.content.map(function(i) {
        return whitespace(depth+2)+html(i, depth + 2);
      }).join('\n')+'\n';
    } else {
      if(typeof el.content === 'string' || typeof el.content === 'number') {
        result += whitespace(depth+2) + el.content + '\n';
      } else {
        result += whitespace(depth+2) + html(el.content, depth + 2)+'\n';
      }
    }
    result += whitespace(depth) + '</'+el.tag+'>';
  } else {
    result += ' />\n';
  }

  return result;
}

module.exports = {
  Collection: require('./lib/common/collection.js'),
  View: require('./lib/common/view.js'),
  CollectionView: require('./lib/common/collection_view.js'),
  Shim: require('./lib/shim.js'),
  Outlet: require('./lib/common/outlet.js'),

  html: html,

  Server: require('./lib/server.js')
};

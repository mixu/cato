var util = require('util'),
    toHTML = require('htmlparser-to-html');

function html(el) {
  var input = el;
  if(el.render) {
    input = el.render();
  }
  console.log('input', util.inspect(input, false, 10, true));
  var output = toHTML(input);
  console.log('output', output);
  return output;
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

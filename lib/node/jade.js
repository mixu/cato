var $ = require('../common/shim.util.js');
var Parser = require('jade').Parser;

function attr(attrs) {
  var result = {};
  attrs.forEach(function(att) {
    result[att.name] = att.val.replace(/^['"]|['"]$/g, '');
  });
  return result;
}

// converts Jade to $.tag structure
exports.convert = function(str) {
  var tokens = new Parser(str, '', {}).parse(),
      result;

  function traverse(node) {
    var current, children, nodes;
    if(!node) return;
    // ignore anonymous Jade nodes
    if(node.name) {
      current = $.tag(node.name, attr(node.attrs), '');
    } else if(node.val) {
      current = { type: 'text', data: node.val };
    }

    // block.nodes or .nodes
    if(node.block && node.block.nodes){
      nodes = node.block.nodes;
    }
    if(node.nodes) {
      nodes = node.nodes;
    }

    if(nodes) {
      children = nodes.map(traverse);
      if(current) {
        current.children = children;
      }
    }
    if(current) {
      return current;
    } else if(children) {
      return children;
    }
  }

  result = traverse(tokens);

  // console.log('\nInput');
  // console.log(require('util').inspect(tokens, null, 20, true));

  return result;
};

// returns a render function
exports.render = function(root) {
  var result;

  function traverse(node) {
    var current, children;

    if(Array.isArray(node)) {
      return node.map(traverse);
    } else if(node.type && node.type == 'tag') {
      current = "$.tag(\""+node.name+"\", "+JSON.stringify(node.attribs)+', ';

      if(node.children && node.children.length > 0) {
        current += traverse(node.children) + ')';
      } else {
        current += "\"\")";
      }
    } else if(node.type == 'text') {
      if(!node.data) {
        current = '""';
      } else {
        current = JSON.stringify(node.data);
      }
    } else {
      console.error(node);
    }
    return current;
  }

  result = traverse(root);

  return result;
};

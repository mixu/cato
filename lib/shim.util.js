var microee = require('microee');

function isRenderable(obj) {
  // is it a view or outlet? Duck typing: if it conforms to the expected interface, then it is a view or outlet
  return ['attach', 'render'].every(function(name) {
      return typeof obj[name] == 'function';
    });
}

exports.tag = function(tagName, attributes, value) {
  if(arguments.length == 1) {
    // short form call is just token, long form is tagname, attr, content
    attributes = { id: tagName };
    tagName = 'span';
  }

  function renderValue(value) {
    // value may be one of:
    if(value.render && typeof value.render == 'function' ||
      value.type && value.type == 'tag' ||
      typeof value == 'function') {
      // 1. a view object with a .render() function
      // Note: it used to be that .tag() would cause a render but that is not needed in the new
      // model where every tree of renderables is passed through either `.html()` or `.attach()`
      // 2. a DOM element (or equivalent in the current shim)
      // 3. a function representing a binding
      return value;
    } else if(Array.isArray(value)) {
      // 4. an array of any of the others
      // -> items in the array must be views, DOM elements or other arrays
      // (not strings, since they always need a containing $.tag call)
      return value.map(renderValue);
    } else {
      // 5. a string | date | other primitive
      return { type: 'text', data: value };
    }
  }

  var r = { type: 'tag', name: tagName, attribs: attributes, children: [] };
  if(typeof value != 'undefined') {
    if(value !== '') {
      r.children = [].concat(renderValue(value));
    }
  }

  return r;
};

/*
  Util for walking a tree of views / tree of tags / tree of both.

  Used for:

    - converting a tree of tags into HTML text
    - collecting information about:
      - root views in a tree
      - bindings in a tree
      ... for performing actions after the tree has been fully traversed
          and the result has been returned
*/

function Walk(tree) {
  this.tree = tree;
  this.stack = [];
}

microee.mixin(Walk);

Walk.prototype.map = function(cb) {
  this.stack.push(cb);
  return this;
};

// When doing the reduce, it is the job of the reduce function to
// apply the function it is given just **before** it processes the input
Walk.prototype.reduce = function(reduceFn) {
  var self = this;

  function applicator(input, parent) {
    // apply the map stack on the node
    var result = input,
        i = 0;
    for(; i < self.stack.length; i++) {
      result = self.stack[i](result, parent);
    }
    return result;
  }

  return reduceFn(this.tree, applicator);
};

/*
  function walk(item, parent) {
    // apply recursively to arrays
    if(Array.isArray(item)) {
      return item.map(function(value) {
        return walk(value, parent);
      });
    }
    // now, recurse further
    if(result.type == 'tag') {
      // is it a tag? if it has children, then recurse into the children with the same parent
      if(result.children) {
        walk(result.children, parent);
      }
    } else if(isRenderable(result)) {
      // elements have children - views have a render function (which expresses the children in a indirect way)
      // the render function is guaranteed to return the same result every time (until the view is reset?)
      walk(result.render(), item);
    }

    return result;
  }

  return walk(this.tree, null);
*/

exports.Walk = Walk;

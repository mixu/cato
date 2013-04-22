var microee = require('microee');

exports.isRenderable = function isRenderable(obj) {
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

// Helper function: takes an array of functions and returns a function that applies them all in one step
// Used to combine functions when only one callback is supported
exports.chain = function(fns) {
  return function(input, parent) {
    // apply the map stack on the node
    var result = input,
        i = 0;
    for(; i < fns.length; i++) {
      result = fns[i](result, parent);
    }
    return result;
  };
};

// This function is always applied just before converting a mixed-content tree into HTML
exports.expandRenderables = function expandRenderables(item, parent) {
  // if the item is renderable, use the render() result
  if(item.render) return item.render();
  // if the item is a function, use the result from invoking it
  // if(typeof item == 'function') return item();
  return item;
};

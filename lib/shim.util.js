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

exports.dfsTraverse = function(tree, callback) {
  var nodes = (Array.isArray(tree) ? tree : [tree]),
      // all the initial nodes have a "undefined" parent tag
      parentTags = nodes.map(function() { return undefined; }),
      // all the initial nodes have a "undefined" parent view
      parentViews = nodes.map(function() { return undefined; }),
      item, parentTag, parentView;

  function push(nextParentView, children) {
    if(Array.isArray(children)) {
      nodes = children.concat(nodes);
      // the current tag is the parent of it's children (duh!)
      parentTags = children.map(function() { return item; }).concat(parentTags);
      // the parent view only changes occasionally - when we render things!
      parentViews = children.map(function() { return nextParentView; }).concat(parentViews);
    } else {
      nodes.unshift(children);
      parentTags.unshift(item);
      parentViews.unshift(nextParentView);
    }
  }

  // really, when a view is rendered, there are two items:
  // - the object representing the view
  // - the tag (with the same id as the view) from the render which encloses the content of the view

  while(nodes.length > 0) {
    item = nodes.shift();
    parentTag = parentTags.shift();
    parentView = parentViews.shift();

    // skip text nodes
    if(item.type && item.type == 'text') continue;

    // process the current node
    callback(item, parentTag, parentView);
    // the next parent view is:
    if(item.render) {
      // if this item is a renderable, then this item is the next parent
      push(item, item.render());
    } else if(item.children) {
      // push all the child nodes of the current node at the top of the stack
      // since this item is not renderable, parentView is the same for the children as it is for this item
      push(parentView, item.children);
    }
  }
  return;
};

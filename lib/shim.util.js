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

exports.walk = function(item, parent) {
  // apply recursively to arrays
  if(Array.isArray(item)) {
    item.forEach(function(value) {
      walk(value, parent);
    });
    return;
  }
  // is it not an object, or is it false, zero, empty string, null, undefined, NaN or a text node? If yes, go no further.
  if(typeof item != 'object' || !item || item.type && item.type == 'text') return;
  if(item.type == 'tag') {
    // is it a tag? if it has children, then recurse into the children with the same parent
    if(item.children) {
      walk(item.children, parent);
    }
  } else if(isRenderable(item)) {
    if(parent) {
      // assign the parent relationship
      item.parent = parent;
      // assign the child relationship (???)
      if(!parent.children) {
        parent.children = [];
      }

      parent.children.push(item);
      // The basic issue is that there is no easy way for parents to track just their immediate
      // children - since the child-parent relationship is established with intermediary, containing elements
    } else {
      // this is a root
      roots.push(item);
      item.parent = null;
    }
    // elements have children - views have a render function (which expresses the children in a indirect way)
    // the render function is guaranteed to return the same result every time (until the view is reset?)

    walk(item.render(), item);
  }
};

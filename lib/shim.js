var htmlparser = require('htmlparser'),
    toHTML = require('htmlparser-to-html');

var dom = { tag: "html", content: { tag: "body" } },
    byId = { body: dom },
    parentById = { body: dom },
    counter = 1;

function Shim(expr) {
  if (!(this instanceof arguments.callee)) {
    return new Shim(expr);
  }
  this.expr = expr;
}

Shim.id = function(count) {
  if(isNaN(count)) return counter++;
  var result = [];
  while(count > 0) {
    result.push(counter++);
    count--;
  }
  return result;
};

Shim.get = Shim.prototype.get = function(token) {
  if(!byId[token]) {
    throw new Error('Cannot get element: '+ token);
  }
  return byId[token];
}

Shim.parseHTML = function(data) {
  // passthrough - Node side always represents things as DOM elements
  return data;
};

// set the inner content of a HTML element
Shim.prototype.update = function(value) {
  var el = this.get(this.expr);
  el.content = value;
  if(value && value.id) {
    parentById[value.id] = el;
  }
};

// append
Shim.prototype.append = function(value) {
  var el = this.get(this.expr);
  // check the target
  if(!el.children) {
    throw new Error('Target element must have a .children property: ' +JSON.stringify(el));
  }
  // check the value
  if (typeof value === 'string') {
    // jQuery can accept text - we need to convert it in the Node shim
    value = Shim._objectify(value);
  } else if (!value.type) {
    // 1. a DOM element (or equivalent in the current shim)
    throw new Error('Value must be a html element: ' +JSON.stringify(value));
  }
  if(Array.isArray(el.children)) {
    el.children.push(value);
  } else {
    el.children = [ el.children, value ];
  }
  if(value.attribs && value.attribs.id) {
    parentById[value.id] = el;
  }
};

// insert before
Shim.prototype.before = function(value) {

};

Shim.prototype.toggle = function(value) {
  // toggle visibility
};

Shim.prototype.on = function(event, callback) {
  this.get(this.expr).on(event, callback);
};

Shim.prototype.addClass = function(value) {
};

Shim.prototype.removeClass = function() {
};

Shim.tag = function(tagName, attributes, value) {
  if(arguments.length == 1) {
    // short form call is just token, long form is tagname, attr, content
    attributes = { id: tagName };
    tagName = 'span';
  }

  function renderValue(value) {
    // value may be one of:
    if(value.render && typeof value.render == 'function' || value.type && value.type == 'tag') {
      // 1. a view object with a .render() function
      // Note: it used to be that .tag() would cause a render but that is not needed in the new
      // model where every tree of renderables is passed through either `.html()` or `.attach()`
      // 2. a DOM element (or equivalent in the current shim)
      return [ value ];
    } else if(Array.isArray(value)) {
      // 3. an array of any of the others
      // -> items in the array must be views, DOM elements or other arrays
      // (not strings, since they always need a containing $.tag call)
      return value.map(renderValue);
    } else {
      // 4. a string | date | other primitive
      return [ { type: 'text', data: value } ];
    }
  }

  var r = { type: 'tag', name: tagName, attribs: attributes };
  if(value) {
    r.children = renderValue(value);
  }

  if(r.attribs.id) {
    byId[r.attribs.id] = r;
  }
  return r;
};

Shim.viewify = function(tagName, attributes, value) {
  // awkward circular dependency on View
  var View = require('./common/view.js'),
      // create a View instance
      result = new View();

  // generate a .render() function
  result.render = function() {
    if(!attributes) attributes = {};
    if(!attributes.id) attributes.id = Shim.id();
    result.id = attributes.id;
    return Shim.tag('div', attributes, value);
  };
  return result;
};

// jQuery's parseHTML function is useless, since it relies on the ability use innerHTML to create DOM elements
Shim._objectify = function(html) {
  var handler = new htmlparser.DefaultHandler(function(error, dom) {
      if(error) throw error;
    }, { verbose: false, ignoreWhitespace: true });
  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(html);
  // silly async/sync hybrid
  return handler.dom;
};

Shim._reset = function() {
  counter = 1;
};

Shim.html = function(el) {
  return toHTML(el, function preProcess(item) {
    if(item.render) {
      return item.render();
    }
    return item;
  });
};

function isRenderable(obj) {
  // is it a view or outlet? Duck typing: if it conforms to the expected interface, then it is a view or outlet
  return ['attach', 'render'].every(function(name) {
      return typeof obj[name] == 'function';
    });
}

// like .html(), except rather than returning a value,
// this converts the content to html and triggers .attach()
// on the content
Shim.attach = function(target, el) {
  // there are two basic structures that can be sent as input:
  // 1. trees with a single root:
  // e.g. View( [ text, view, outlet ] )
  // 2. arrays with one or more trees
  // e.g [ text, View([ outlet ]), outlet ]
  var roots = [];

  // prior to converting to DOM elements, we need to walk the structure,
  // find the roots and connect their children to their parents
  // this way, the roots are explicitly aware of their immediate children
  // and can bubble events down (attach) or up (click)

  function walk(item, parent) {
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

      if(item.render) {
        walk(item.render(), item);
      }
    }
  }

  walk(el);

  (new Shim(target)).update(Shim.html(el));

  roots.forEach(function(root) {
    // notify each of the tree roots that they have been attached to the DOM
    root.attach();
  });
};

module.exports = Shim;


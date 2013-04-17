var $ = require('jQuery'),
    toHTML = require('htmlparser-to-html');

var counter = 1;

function Shim(expr) {
  if (!(this instanceof arguments.callee)) {
    return new Shim(expr);
  }
  this.expr = expr;
}

Shim.id = function(count) {
  if(isNaN(count)) return 's'+counter++;
  var result = [];
  while(count > 0) {
    result.push('s'+counter++);
    count--;
  }
  return result;
};

Shim.get = Shim.prototype.get = function(token) {
  if(typeof token !== 'string') {
    return token;
  }
  return $('#'+token);
};

Shim.prototype.toggle = function(value) {
  this.get(this.expr).toggle(value);
};

Shim.prototype.on = function(event, callback) {
  this.get(this.expr).on(event, callback);
};

Shim.prototype.addClass = function(value) {
  this.get(this.expr).addClass(value);
};

Shim.prototype.removeClass = function(value) {
  this.get(this.expr).removeClass(value);
};

// use .tag() within a view, and .el() to finalize the view
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
      return value;
    } else if(Array.isArray(value)) {
      // 3. an array of any of the others
      // -> items in the array must be views, DOM elements or other arrays
      // (not strings, since they always need a containing $.tag call)
      return value.map(renderValue);
    } else {
      // 4. a string | date | other primitive
      return { type: 'text', data: value };
    }
  }

  var r = { type: 'tag', name: tagName, attribs: attributes };
  if(typeof value != undefined) {
    if(value === '') {
      r.children = [];
    } else {
      r.children = [].concat(renderValue(value));
    }
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

Shim._objectify = function(html) {
  // on the web, this easy: run the HTML through jQuery's string to DOM object converter
  return $.parseHTML(html);
};

Shim._reset = function() {
  counter = 1;
};

Shim._html = function(el) {
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

// insert, replacing content
Shim.prototype.update = function(value) {
  var self = this;
  Shim._attach(value, function(txt){
    console.log(self.expr, 'update', txt);
    self.get(self.expr).html(txt);
  });
};

// attach as the last child
Shim.prototype.append = function(value) {
  var self = this;
  Shim._attach(value, function(txt){
    console.log(self.expr, 'append', txt);
    self.get(self.expr).append(txt);
  });
};

// attach as a sibling just before
Shim.prototype.before = function(value) {
  Shim._attach(value, function(txt){
    console.log(self.expr, 'before', txt);
    self.get(self.expr).before(txt);
  });
};

Shim.prototype.remove = function() {
  this.get(this.expr).remove();
};

// like .html(), except rather than returning a value,
// this converts the content to html and triggers .attach()
// on the content
Shim._attach = function(el, task) {
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

  task(Shim._html(el));

  roots.forEach(function(root) {
    // notify each of the tree roots that they have been attached to the DOM
    root.attach();
  });
};

module.exports = Shim;

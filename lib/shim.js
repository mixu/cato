var htmlparser = require('htmlparser'),
    toHTML = require('htmlparser-to-html'),
    ShimUtil = require('./shim.util.js');

var dom = { type: 'tag', name: "html", children: [] },
    byId = { body: dom },
    parentById = { body: dom },
    counter = 1;

// takes a piece of HTML and converts it into a emulated DOM object
function objectify(html) {
  var handler = new htmlparser.DefaultHandler(function(error, dom) {
      if(error) throw error;
    }, { verbose: false, ignoreWhitespace: true });
  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(html);
  // silly async/sync hybrid
  return handler.dom;
}

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

Shim.tag = ShimUtil.tag;
Shim.viewify = function(tagName, attributes, value) {
  // awkward circular dependency on View
  var View = require('./common/view.js'),
      // create a View instance
      result = new View();

  // generate a ._render() function
  result._render = function() {
    if(!attributes) attributes = {};
    if(!attributes.id) attributes.id = Shim.id();
    result.id = attributes.id;
    return Shim.tag('div', attributes, value);
  };
  return result;
};

Shim._reset = function() {
  counter = 1;
};

// used to update the parentById array
function reparent(elements, parent) {
  if(elements.attribs && elements.attribs.id) {
    parentById[elements.id] = parent;
  }
}

// replace the inner content of a HTML element
Shim.prototype.update = function(value) {
  var el = this.get(this.expr);
  if(!el.children) {
    throw new Error('Target element must have a .children property: ' +JSON.stringify(el));
  }

  Shim._attach(value, function(elements){
    // console.log(self.expr, 'update', txt);
    // replace the inner content, no questions asked
    // TODO: does this require "destroy" events etc.?
    el.children = [ elements ];
    reparent(elements, el);
  });
};

// append
Shim.prototype.append = function(value) {
  var el = this.get(this.expr);
  // check the target
  if(!el.children) {
    throw new Error('Target element must have a .children property: ' +JSON.stringify(el));
  }

  Shim._attach(value, function(elements){
    // if `children` is an array, then concat to it, otherwise convert it to a array and then concat
    el.children = (Array.isArray(el.children) ? el.children : [ el.children ]).concat(elements);
    reparent(elements, el);
  });
};

// insert before
Shim.prototype.before = function(value) {

};

// this task only exists on the Node side
// It keeps the byId array up to date (parentById is updated in the tasks themselves)
// This used to take place in the .tag() phase but really, the element doesn't have a DOM
// addressable ID until it is bound to the DOM
function updateEmulatedDOM(item, parent) {
  if(item.attribs && item.attribs.id) {
    byId[item.attribs.id] = item;
  }
  return item;
}

Shim.html = function(tree) {
  return toHTML(tree, null, ShimUtil.chain([ ShimUtil.expandRenderables, updateEmulatedDOM ]));
};

// like .html(), except rather than returning a value,
// this converts the content to html and triggers .attach()
// on the content
Shim._attach = function(tree, task) {
  // Note: the tree can also be a piece of HTML, so check and handle correctly
  if (typeof tree === 'string') {
    // we need to convert HTML to objects in the Node shim
    tree = objectify(tree);
    // no need to walk the structure, as HTML strings cannot contain views etc.
    return task(tree);
  }

  // 1. trees with a single root:
  // e.g. View( [ text, view, outlet ] )
  // 2. arrays with one or more trees
  // e.g [ text, View([ outlet ]), outlet ]
  var roots = [],
      delayed = [],
      // prior to converting to DOM elements, we need to walk the structure,
      // find the roots and connect their children to their parents
      // this way, the roots are explicitly aware of their immediate children
      // and can bubble events down (attach) or up (click)
      mapTask = ShimUtil.chain([
        function convertTagValueBindings(item) {
          return item;
        },
        function collectRoots(item, parent) {
          // only care about renderable items
          if(!ShimUtil.isRenderable(item)) return item;
          // the issue here is that wrt to html, the parent can be a tag while inside vjs2 we only care about views
          // For now, the htmlparser-to-html is patched to work with this
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
            delayed.push(function() {
              // notify each of the tree roots that they have been attached to the DOM
              item.attach();
            });
          }
          return item;
        },
        ShimUtil.expandRenderables,
        updateEmulatedDOM
      ]),
      // in Node, we just walk the tree - producing HTML here is not necessary
      html = toHTML(tree, null, mapTask);

  // we only walk the tree to trigger the after actions
  // -- and not for the html (it could be removed completely)
  task(tree);

  // run delayed tasks now that the element tree is in the DOM
  for(var i = 0; i < delayed.length; i++) {
    delayed[i]();
  }
};

module.exports = Shim;


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

Shim.tag = function(tagName, attributes, value) {
  // intercept the result to maintain the emulated DOM
  var r = ShimUtil.tag(tagName, attributes, value);
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

Shim._reset = function() {
  counter = 1;
};

// replace the inner content of a HTML element
Shim.prototype.update = function(value) {
  var el = this.get(this.expr);
  if(!el.children) {
    throw new Error('Target element must have a .children property: ' +JSON.stringify(el));
  }

  Shim._attach(value, function(txt){
    // console.log(self.expr, 'update', txt);
    // replace the inner content, no questions asked
    // TODO: does this require "destroy" events etc.?
    el.children = [ value ];

    if(value.attribs && value.attribs.id) {
      parentById[value.id] = el;
    }
    if(value && value.id) {
      parentById[value.id] = el;
    }
  });
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
    value = objectify(value);
  }

  Shim._attach(value, function(txt){
    if(Array.isArray(el.children)) {
      el.children.push(value);
    } else {
      el.children = [ el.children, value ];
    }
    if(value.attribs && value.attribs.id) {
      parentById[value.id] = el;
    }
  });
};

// insert before
Shim.prototype.before = function(value) {

};

Shim.html = function(tree) {
  return toHTML(tree, null, function expandRenderables(item, parent) {
            // if the item is renderable, use the render() result
            if(item.render) return item.render();
            // if the item is a function, use the result from invoking it
            if(typeof item == 'function') return item();
            return item;
         });
};

// like .html(), except rather than returning a value,
// this converts the content to html and triggers .attach()
// on the content
Shim._attach = function(tree, task) {  // there are two basic structures that can be sent as input:
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
        function expandRenderables(item, parent) {
          if(item.render) {
            return item.render();
          }
          return item;
         }
      ]),
      html = toHTML(tree, null, mapTask);
  // convert to HTML and then attach to the DOM
  task(html);
  console.log(roots);

  // run delayed tasks now that the element tree is in the DOM
  for(var i = 0; i < delayed.length; i++) {
    delayed[i]();
  }
};

module.exports = Shim;


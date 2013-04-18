var $ = require('jQuery'),
    toHTML = require('htmlparser-to-html'),
    ShimUtil = require('./shim.util.js');

var counter = 1;

function Shim(expr) {
  if (!(this instanceof arguments.callee)) {
    return new Shim(expr);
  }
  this.expr = expr;
}

// generate one or more unique element ids
Shim.id = function(count) {
  if(isNaN(count)) return 's'+counter++;
  var result = [];
  while(count > 0) {
    result.push('s'+counter++);
    count--;
  }
  return result;
};

// fetch a element from the DOM
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

Shim.tag = ShimUtil.tag;
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


// Convert a tree into HTML without attaching it to the DOM
Shim._html = function(tree) {
  return new Walk(tree)
         .map(function() {
            if(item.render) {
              return item.render();
            }
            return item;
         })
         .map(toHTML)
         .result();
};

// like .html(), except rather than returning a value,
// this converts the content to html and triggers .attach()
// on the content
Shim._attach = function(tree, task) {

  // DFS walk
  var html = new Walk(tree)
              .map(function collectRoots() {

                //
                walk.on('done', function() {
                  // notify each of the tree roots that they have been attached to the DOM
                  root.attach();
                });
              })
              // take the output from that and convert it into HTML
              .map(toHtml)
              .result();

  task(html);

  walk.emit('done');


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

  walk(el);

  task(Shim._html(el));
};

module.exports = Shim;

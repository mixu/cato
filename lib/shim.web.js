var $ = require('jQuery');

var counter = 1;

function Shim(expr) {
  if (!(this instanceof arguments.callee)) {
    return new Shim(expr);
  }
  this.expr = expr;
}

Shim.id = function() {
  return 's'+counter++;
};

Shim.get = Shim.prototype.get = function(token) {
  if(typeof token !== 'string') {
    return token;
  }
  return $('#'+token);
};

Shim.prototype.update = function(value) {
  console.log(this.expr, 'update', value);
  this.get(this.expr).html(value);
};

Shim.prototype.append = function(value) {
  console.log(this.expr, 'append', value);
  this.get(this.expr).append(value);
};

Shim.prototype.before = function(value) {
  this.get(this.expr).before(value);
};

Shim.prototype.remove = function() {
  this.get(this.expr).remove();
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
  function stringify(c) {
    if(Array.isArray(c)) return c.join('');
    return c.toString();
  }
  if(arguments.length == 1) {
    // short form call is just token, long form is tagname, attr, content
    attributes = { id: tagName };
    tagName = 'span';
  }

  // value may be one of:
  // 1. a string | date | other primitive
  // 2. an array of the above
  // It may NOT be a DOM element

  var s = '<'+tagName+
        Object.keys(attributes).reduce(function(prev, key) {
          return prev + ' '+key+'="'+attributes[key]+'"'
        }, '') + '>'+(value ? stringify(value) : '')+'</'+tagName+'>';
  return s;
};

// generates a single DOM element, with specific attributes and innerHTML
Shim.el = function(tagName, attributes, content) {
  // Note: returns real DOM nodes via jQuery
  // might use createElement at some point
  return $.parseHTML(Shim.tag(tagName, attributes, content));
};

module.exports = Shim;

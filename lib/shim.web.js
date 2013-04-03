var $ = require('jQuery');

var counter = 1;

function Shim(expr) {
  if (!(this instanceof arguments.callee)) {
    return new Shim(expr);
  }
  this.expr = expr;
}

Shim.id = function() {
  return '#s'+counter++;
};

Shim.get = Shim.prototype.get = function(token) {
  if(typeof token !== 'string') {
    return token;
  }
  return $(token);
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

Shim.el = function(tagName, attributes, content) {
  function stringify(c) {
    if(Array.isArray(c)) return c.join('');
    return c.toString();
  }
  if(arguments.length == 1) {
    // short form call is just token, long form is tagname, attr, content
    attributes = { id: tagName };
    tagName = 'span';
  }
  var s = '<'+tagName+
        Object.keys(attributes).reduce(function(prev, key) {
          return prev + ' '+key+'="'+attributes[key]+'"'
        }, '') + '>'+(content ? stringify(content) : '') + '</'+tagName+'>';
  return s;
};

module.exports = Shim;

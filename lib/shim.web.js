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

Shim.prototype.update = function(value) {
//  console.log(this.expr, 'update', value);
  this.get(this.expr).html(value);
};

Shim.prototype.append = function(value) {
//  console.log(this.expr, 'append', value);
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
  if(arguments.length == 1) {
    // short form call is just token, long form is tagname, attr, content
    attributes = { id: tagName };
    tagName = 'span';
  }

  function renderValue(value) {
    // value may be one of:
    if(value.render && typeof value.render == 'function') {
      // 1. a view object with a .render() function
      return [ value.render() ];
    } else if (value.type && value.type == 'tag') {
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

Shim.html = function(el) {
  var input = el;
  if(el.render) {
    input = el.render();
  }
  return toHTML(input);
};

module.exports = Shim;

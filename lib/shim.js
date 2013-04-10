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

Shim.id = function() {
  return counter++;
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
  var input = el;
  if(el.render) {
    input = el.render();
  }
  return toHTML(input);
};

module.exports = Shim;


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
  if(Array.isArray(el.content)) {
    el.content.push(value);
    parentById[value.id] = el;
  } else if(typeof el.content === 'string') {
    el.content = [ el.content, value ];
    parentById[value.id] = el;
  } else {
    throw new Error('Element content has to be a string or an array: ' +JSON.stringify(el));
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
// generates a single DOM element, with specific attributes and innerHTML
Shim.el = function(tagName, attributes, value) {
  if(!attributes) attributes = {};
  if(!attributes.id) attributes.id = Shim.id();
  var result = Shim.tag(tagName, attributes, value);
  Object.defineProperty(result, 'isDomElement', {
      enumerable: false,
      value: true,
      writable: false
  });
  result.isDomElement = true;
  return result;
};

Shim.tag = function(tagName, attributes, value) {
  if(arguments.length == 1) {
    // short form call is just token, long form is tagname, attr, content
    attributes = { id: tagName };
    tagName = 'span';
  }
  var r = { tag: tagName, attr: attributes };
  if(value) {
    if(value.render && typeof value.render == 'function') {
      // render returns an el
      r.content = value.render();
    } else {
      r.content = value;
    }
    if(!value.toString) {
      throw new Error('Tag content must implement .toString(). If you need to insert DOM elements, use .append()!');
    }
  }

  if(r.attr.id) {
    byId[r.attr.id] = r;
  }

  return r;
};

Shim._reset = function() {
  counter = 1;
};

module.exports = Shim;


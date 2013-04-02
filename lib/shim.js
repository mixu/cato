var dom = { tag: "html", content: { tag: "body" } },
    byId = { body: dom },
    parentById = { body: dom };

function Shim(expr) {
  if (!(this instanceof arguments.callee)) {
    return new Shim(expr);
  }
  this.expr = expr;
}

Shim.get = Shim.prototype.get = function(token) {
  if(!byId[token]) {
    throw new Error('Cannot get element: '+ token);
  }
  return byId[token];
}

// set the inner content of a HTML element
Shim.prototype.update = function(content) {
  console.log('shim.update', content);
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


// generate a HTML element as a JSON object (e.g. to allow DOM manipulation under Node or stringification)
Shim.el = function(tagName, attributes, content) {
  if(arguments.length == 1) {
    // short form call is just token, long form is tagname, attr, content
    attributes = { id: tagName };
    tagName = 'span';
  }
  var r = { tag: tagName, attr: attributes };
  if(content) {
    r.content = content;
    if(typeof content === 'object' && content.id) {
      parentById[content.id] = r;
    }
  }

  if(r.attr.id) {
    byId[r.attr.id] = r;
  }

  return r;
};

module.exports = Shim;


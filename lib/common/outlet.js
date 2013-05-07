var microee = require('microee'),
    $ = require('../shim.js');

/*
  Outlet is a base type representing an array of views.

- .add(models, [options]) / .remove(models, [options]): also, sugared forms (push/pop/unshift/shift)
- .reset()
- .at(index)
- .show() / .hide(): takes all the contained views and the top level element, and shows/hides them
*/

var states = {
  initial: 1,  // = destroyed (unbound)
  rendered: 2, // = detached from DOM
  attached: 3, // = unbound DOM events
  bound: 4
};


// A DOM-aware, renderable array of views with a wrapping element
function Outlet(tagName, attributes, content) {
  this.tagName = tagName || 'div';
  if(!attributes) attributes = {};
  if(!attributes.id) attributes.id = $.id();
  this.id = attributes.id;
  this.attributes = attributes;
  this.tagContent = content || '';
  this.reset();
}

microee.mixin(Outlet);

// Render returns DOM elements (or their local equivalent)
Outlet.prototype.render = function() {
  // if rendered, just return the element
  if(this._state >= states.rendered) {
    return this._renderCache;
  }
  // set to rendered
  this._state = states.rendered;
  this._renderCache = $.tag(this.tagName, this.attributes, this.tagContent);
  this.emit('render');
  return this._renderCache;
};

Outlet.prototype.ensureElement = function() {
  if(this._state < states.rendered) {
    // must be rendered before being bound
    this.render();
  }
};

Outlet.prototype.add = function(view, options) {
  this.ensureElement();

  var index = (options && options.at ? options.at : this._contents.length);
  // render + append the view to the DOM
  if(this._contents.length == 0 || index == this._contents.length) {
    // the first insert, and inserting at the last position both need to use .append
    $(this.id).append(view);
  } else {
    $(this._contents[index].id).before(view);
  }

  // then add view to the contents
  this._contents.splice(index, 0, view);
};

Outlet.prototype.remove = function(view, options) {
  var index = this._contents.indexOf(view);
  if(index != -1) {
    this._contents[index].destroy();
    delete this._contents[index];
  }
};

Outlet.prototype.reset = function() {
  this.length = 0;
  this._contents = [];
  this._state = states.initial;
  // reference to the DOM fragment object for this view
  this._renderCache = null;
};

Outlet.prototype.at = function(index) {
  return this._contents[index];
};

// index is optional
Outlet.prototype.show = function(index, context) {
  if(arguments.length > 0 && this._contents[index]) {
    // call the method if it exists - otherwise toggle the div (todo: should this be supported?)
    (this._contents[index].toggle ?
      this._contents[index]
      : $(this._contents[index].id)).toggle(true, context);
  } else {
    $(this.id).toggle(true);
  }
};

// index is optional
Outlet.prototype.hide = function(index, context) {
  if(arguments.length > 0 && this._contents[index]) {
    (this._contents[index].toggle ?
      this._contents[index]
      : $(this._contents[index].id)).toggle(false, context);
  } else {
    $(this.id).toggle(false);
  }
};

['filter', 'forEach', 'every', 'map', 'some'].forEach(function(name) {
  Outlet.prototype[name] = function() {
    return Array.prototype[name].apply(this._contents, arguments);
  }
});

// part of the uniform view interface (e.g. a renderable is togglable)
Outlet.prototype.toggle = function(visible) {
  $(this.id).toggle(visible);
};

// notify that this view has been attached onto the DOM
Outlet.prototype.attach = function() {
  // emit on this view
  this.emit('attach');
  // emit on all items in the children array
  if(this.children && Array.isArray(this.children)) {
    this.children.forEach(function(child) {
      child.attach();
    });
  }
};

Outlet.mixin = function(dest) {
  var k;
  for (k in this.prototype) {
    this.prototype.hasOwnProperty(k) && (dest.prototype[k] = this.prototype[k]);
  }
  // include the mixin() method
  dest.mixin = this.mixin;
};

module.exports = Outlet;

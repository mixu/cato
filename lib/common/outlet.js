var microee = require('microee'),
    $ = require('../shim.js');

/*
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

Outlet.prototype.render = function() {
  // if rendered, just return the element
  if(this._state >= states.rendered) {
    return this._fragment;
  }
  // set to rendered
  this._state = states.rendered;

  this._fragment = $.tag(this.tagName, this.attributes, this.tagContent);
  return this._fragment;
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
    $(this.id).append($.html(view.render()));
  } else {
    $(this._contents[index].id).before($.html(view.render()));
  }
  // trigger attach
  view.emit('attach');

  // then add view to the contents
  this._contents.splice(index, 0, view);
};

Outlet.prototype.remove = function(view, options) {
  var index = this._contents.indexOf(view);
  if(index != -1) {
    delete this._contents[index];
  }
};

Outlet.prototype.reset = function() {
  this.length = 0;
  this._contents = [];
  this._state = states.initial;
  // reference to the DOM fragment object for this view
  this._fragment = null;
};

Outlet.prototype.at = function(index) {
  return this._contents[index];
};

// index is optional
Outlet.prototype.show = function(index) {
  if(arguments.length > 0) {
    this._contents[index] && $(this._contents[index].id).toggle(true);
  } else {
    $(this.id).toggle(true);
  }
};

// index is optional
Outlet.prototype.hide = function(index) {
  if(arguments.length > 0) {
    this._contents[index] && $(this._contents[index].id).toggle(false);
  } else {
    $(this.id).toggle(false);
  }
};

['filter', 'forEach', 'every', 'map', 'some'].forEach(function(name) {
  Outlet.prototype[name] = function() {
    return Array.prototype[name].apply(this._contents, arguments);
  }
});

module.exports = Outlet;

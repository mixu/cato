var microee = require('microee'),
    $ = require('../shim.js');

var states = {
  initial: 1,  // = destroyed (unbound)
  rendered: 2, // = detached from DOM
  attached: 3, // = unbound DOM events
  bound: 4
};

var delegateEventSplitter = /^(\S+)\s*(.*)$/;

function View() {
  this._state = states.initial;
  this._renderCache = null;
}

microee.mixin(View);

View.prototype.bind = function(model) {
  this.model = model;
  // establish subscriptions from the model change events to the value bindings (in the DOM)
  // and any wildcard event handlers for the model
};

// ._render() is implemented by each subclass
View.prototype.render = function() {
  if(!this._renderCache) {
    this._renderCache = this._render();
  }
  this.emit('render');
  return this._renderCache;
};

View.prototype.toggle = function(visible) {
  this.id && $(this.id).toggle(visible);
};

// notify that this view has been attached onto the DOM
View.prototype.attach = function() {
  // emit on this view
  this.emit('attach');

  // detach DOM events on destroy - better place(?)
  this.on('destroy', function() {
    $.off('.delegateEvents' + self.id);
  });

  // emit on all items in the children array
  if(this.children && Array.isArray(this.children)) {
    this.children.forEach(function(child) {
      child.attach();
    });
  }
};

// when the current view is removed/destroyed, make sure that event callbacks set on
// a remaining target are cleaned up
View.prototype.listenTo = function(target, eventName, callback) {
  target.on(eventName, callback);
  this.on('destroy', function() {
    target.removeListener(eventName, callback);
  });
  return this;
};

// when the current view is removed/destroyed,
// clean up this DOM listener (via .off with a custom namespace)
View.prototype.listenDom = function(selector, callback) {
  var match = key.match(delegateEventSplitter),
      eventName = match[1] + '.delegateEvents' + this.id,
      selector = match[2];
  if (selector === '') {
    this.$el.on(eventName, method);
  } else {
    this.$el.on(eventName, selector, method);
  }
  return this;
};

// notify the view that it is being destroyed
View.prototype.destroy = function() {
  // emit on this view
  this.emit('destroy');
  // emit on all items in the children array
  if(this.children && Array.isArray(this.children)) {
    this.children.forEach(function(child) {
      child.destroy();
    });
  }
};

View.mixin = function(dest) {
  var k;
  for (k in this.prototype) {
    this.prototype.hasOwnProperty(k) && (dest.prototype[k] = this.prototype[k]);
  }
};

module.exports = View;

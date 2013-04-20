var microee = require('microee'),
    $ = require('../shim.js');

var states = {
  initial: 1,  // = destroyed (unbound)
  rendered: 2, // = detached from DOM
  attached: 3, // = unbound DOM events
  bound: 4
};

function View() {
  this._state = states.initial;
}

microee.mixin(View);

View.prototype.bind = function(model) {
  this.model = model;
  // establish subscriptions from the model change events to the value bindings (in the DOM)
  // and any wildcard event handlers for the model
};

// ._render() is implemented by each subclass
View.prototype.render = function() {
  var result = this._render();
  this.emit('render');
  return result;
};

View.prototype.toggle = function(visible) {
  this.id && $(this.id).toggle(visible);
};

// notify that this view has been attached onto the DOM
View.prototype.attach = function() {
  // console.log(this.constructor.name+':attach', this.id, this);
  // bind DOM events

  if(this.domEvents) {
    console.log('attaching dom events', this.domEvents);
    this.domEvents.forEach(function(evt) {
      $(evt.selector).on('click', evt.cb);
    });
  }
  // emit on this view
  this.emit('attach');

  // emit on all items in the children array
  if(this.children && Array.isArray(this.children)) {
    this.children.forEach(function(child) {
      child.attach();
    });
  }
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

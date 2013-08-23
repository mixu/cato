var microee = require('microee'),
    $ = (typeof window != 'undefined' ? require('../web/shim.js') : require('../shim.js')),
    log = require('minilog')('cato/view');

// default log level >= info
log.suggest.deny('cato/view', 'info');

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
    // check that render has produced an id
    if(!this.id) {
      this.id = $.id();
    }
    // check that the top level item -- if it is a tag -- has an id element
    if(this._renderCache.attrib && !this._renderCache.attrib.id) {
      this._renderCache.attrib.id = this.id;
    }
  }
  this.emit('render');
  return this._renderCache;
};

View.prototype.toggle = function(visible, context) {
  this.id && $(this.id).toggle(visible);
  this.emit(visible ? 'show' : 'hide', context);
};

// notify that this view has been attached onto the DOM
View.prototype.attach = function() {
  var self = this;
  // emit on this view
  this.emit('attach');

  // detach DOM events on destroy - better place(?)
  this.once('destroy', function() {
    // $.off('.delegateEvents' + self.id);
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
  var self = this;
  if(!target.on) return;
  target.on(eventName, callback);
  this.when('unbind', function(model) {
    if(!model || model == target)  {
      // Fixme: this is caused by the fact that BB uses .off() while Node uses .removeListener()
      if(target.removeListener) {
        target.removeListener(eventName, callback);
      }
      if(target.off) {
        target.off(eventName, callback);
      }
      return true; // remove callback
    }
    return false;
  });
  this.once('rebind', function(from, to) {
    log.info('rebinding '+eventName+' from', from, 'to', to);
    self.emit('unbind', from);
    self.listenTo(to, eventName, callback);
  });
  log.info('listenTo', target, eventName);
  return this;
};

// when the current view is removed/destroyed,
// clean up this DOM listener (via .off with a custom namespace)
View.prototype.listenDom = function(selector, callback) {
  var match = selector.match(delegateEventSplitter),
      eventName = match[1] + '.delegateEvents' + this.id;
  selector = match[2];

  if(typeof jQuery != 'undefined') {
    if (selector === '') {
      jQuery('#' + this.id).on(eventName, callback);
      log.info('listenDom', "jQuery(#"+ this.id+").on("+eventName+")", callback);
    } else {
      jQuery(selector).on(eventName, callback);
      log.info('listenDom', "jQuery("+ selector+").on("+eventName+")", callback);
    }
  }
  return this;
};

// notify the view that it is being destroyed
View.prototype.destroy = function() {
  // remove from DOM
  $(this.id).remove();

  // emit on this view
  this.emit('unbind');
  this.emit('destroy');
  // emit on all items in the children array
  if(this.children && Array.isArray(this.children)) {
    this.children.forEach(function(child) {
      child && child.destroy && child.destroy();
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

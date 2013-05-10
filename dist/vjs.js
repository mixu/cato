(function(){function require(p, context, parent){ context || (context = 0); var path = require.resolve(p, context), mod = require.modules[context][path]; if (!mod) throw new Error('failed to require "' + p + '" from ' + parent); if(mod.context) { context = mod.context; path = mod.main; mod = require.modules[context][mod.main]; if (!mod) throw new Error('failed to require "' + path + '" from ' + context); } if (!mod.exports) { mod.exports = {}; mod.call(mod.exports, mod, mod.exports, require.relative(path, context)); } return mod.exports;}require.modules = [{}];require.resolve = function(path, context){ var orig = path, reg = path + '.js', index = path + '/index.js'; return require.modules[context][reg] && reg || require.modules[context][index] && index || orig;};require.relative = function(relativeTo, context) { return function(p){ if ('.' != p.charAt(0)) return require(p, context, relativeTo); var path = relativeTo.split('/') , segs = p.split('/'); path.pop(); for (var i = 0; i < segs.length; i++) { var seg = segs[i]; if ('..' == seg) path.pop(); else if ('.' != seg) path.push(seg); } return require(path.join('/'), context, relativeTo); };};
require.modules[0] = { "jquery": { exports: window.$ }
,"lib/browser/array.js": function(module, exports, require){var cache = [ ];

module.exports = {
  write: function(str) {
    cache.push(str);
  },
  end: function() {},
  // utility functions
  get: function() { return cache; },
  empty: function() { cache = []; }
};
},"lib/browser/console.js": function(module, exports, require){var newlines = /\n+$/;

module.exports = {
  write: function(str) {
    var args = Array.prototype.slice.call(arguments),
        len = args.length,
        last = args[args.length-1];
    if (typeof console === 'undefined' || !console.log) return;
    if(last && typeof last === 'string') {
      args[args.length -1] = last.replace(newlines, '');
    }
    if (console.log.apply) {
      // console.log.apply is undefined in IE8 and IE9
      // and still useless for objects in IE9. But useful for non-IE browsers.
      return console.log.apply(console, args);
    }
    if(!JSON || !JSON.stringify) return;
    // for IE8/9: make console.log at least a bit less awful
    for(var i = 0; i < len; i++) {
      args[i] = JSON.stringify(args[i]);
    }
    console.log(args.join(' '));
  },
  end: function() {}
};
},"lib/browser/localstorage.js": function(module, exports, require){var cache = false;

module.exports = {
  write: function(str) {
    if(typeof window == 'undefined' || !window.localStorage ||
       typeof JSON == 'undefined' || !JSON.stringify || !JSON.parse) return;
    if(!cache) { cache = (window.localStorage.minilog ? JSON.parse(window.localStorage.minilog) : []); }
    cache.push(new Date().toString() + ' '+ str);
    window.localStorage.minilog = JSON.stringify(cache);
  },
  end: function() {}
};
},"lib/index.js": function(module, exports, require){var Minilog = require('./minilog.js');

Minilog.format(function(name, level, args) {
  var prefix = [];
  if(name) prefix.push(name);
  if(level) prefix.push(level);
  return prefix.concat(args).join(' ') + '\n';
});

// support for enabling() console logging easily
var enabled = false, whitelist = [], levelMap = { debug: 1, info: 2, warn: 3, error: 4 };

function filter(name, level) {
  var i, expr;
  for(i = 0; i < whitelist.length; i++) {
    expr = whitelist[i];
    if (expr.topic && expr.topic.test(name) && (expr.level == levelMap.debug || levelMap[level] >= expr.level)) {
      return true;
    }
  }
  return false;
}

Minilog.enable = function(str) {
  if(!enabled) { Minilog.pipe(require('./browser/console.js')).filter(filter); }
  enabled = true;
  whitelist = [];
  if(!str) { str = '*.debug'; }
  var parts = str.split(/[\s,]+/), i, expr;
  for(i = 0; i < parts.length; i++) {
    expr = parts[i].split('.');
    if(expr.length > 2) { expr = [ expr.slice(0, -1).join('.'), expr.slice(-1).join() ]; }
    whitelist.push({ topic: new RegExp('^'+expr[0].replace('*', '.*')), level: levelMap[expr[1]] || 1 });
  }
  if(typeof window != 'undefined' && window.localStorage) {
    window.localStorage.minilogSettings = JSON.stringify(str);
  }
};

// apply enable inputs from localStorage and from the URL
if(typeof window != 'undefined') {
  if(window.localStorage && window.localStorage.minilogSettings) {
    try {
      Minilog.enable(JSON.parse(window.localStorage.minilogSettings));
    } catch(e) { }
  }
  if(window.location && window.location.search) {
    var match = RegExp('[?&]minilog=([^&]*)').exec(window.location.search);
    match && Minilog.enable(decodeURIComponent(match[1]));
  }
}

exports = module.exports = Minilog;


exports.backends = {  browser: require('./browser/console.js'),
  array: require('./browser/array.js'),
  localstorage: require('./browser/localstorage.js')};}
,"lib/minilog.js": function(module, exports, require){var callbacks = [],
    log = { readable: true },
    def = { format: function() { return ''; } };

log.on = log.addListener = function(ev, callback) {
  callbacks[ev] || (callbacks[ev] = []);
  callbacks[ev].unshift( callback );
  return log;
};

log.emit = function(ev) {
  if(!callbacks[ev]) return;
  var args = Array.prototype.slice.call(arguments, 1);
  for(var i = callbacks[ev].length-1; i >= 0; i--){
    callbacks[ev][i] && callbacks[ev][i].apply(log, args);
  }
};

log.removeListener = log.removeAllListeners = function(ev, callback) {
  if(!callbacks[ev]) return;
  if(!callback) { delete callbacks[ev]; return; }
  for(var i = callbacks[ev].length-1; i >= 0; i--) {
    if(callbacks[ev][i] == callback) {
      callbacks[ev].splice(i, 1);
    }
  }
};

log.serialize = function(items) {
  if(!JSON || !JSON.stringify) return items;
  var result = [];
  for(var i = 0; i < items.length; i++) {
    if(items[i] && typeof items[i] == 'object') {
      // Buffers in Node.js look bad when stringified
      if(items[i].constructor && items[i].constructor.isBuffer) {
        result[i] = items[i].toString();
      } else {
        result[i] = JSON.stringify(items[i]);
      }
    } else {
      result[i] = items[i];
    }
  }
  return result;
};

exports = module.exports = function create(name) {
  var o   = function() { log.emit('item', name, undefined, Array.prototype.slice.call(arguments)); return o; };
  o.debug = function() { log.emit('item', name, 'debug', Array.prototype.slice.call(arguments)); return o; };
  o.info  = function() { log.emit('item', name, 'info',  Array.prototype.slice.call(arguments)); return o; };
  o.warn  = function() { log.emit('item', name, 'warn',  Array.prototype.slice.call(arguments)); return o; };
  o.error = function() { log.emit('item', name, 'error', Array.prototype.slice.call(arguments)); return o; };
  return o;
};

exports.format = function(formatter) {
  def.format = formatter;
};

exports.pipe = function(dest) {
  var config = {};
  if(dest._isFormatted) {
    log.on('item', function(name, level, args) {
      if(config.filter && !config.filter(name, level)) return;
      dest.write((config.format ? config : dest).format(name, level, args));
    });
  } else {
    log.on('item', function(name, level, args) {
      if(config.filter && !config.filter(name, level)) return;
      dest.write((config.format ? config : def).format(name, level, log.serialize(args)));
    });
  }
  log.on('end', function() { !dest._isStdio && dest.end(); });
  var chain = {
    filter: function(cb) { config.filter = cb; return chain; },
    format: function(cb) { config.format = cb; return chain; },
    pipe: exports.pipe
  };
  return chain;
};

exports.end = function() {
  log.emit('end');
  callbacks = [];
};
}};
Minilog = require('lib/index.js');
}());/*global Minilog:false */(function(){function require(e,t){for(var n=[],r=e.split("/"),i,s,o=0;s=r[o++];)".."==s?n.pop():"."!=s&&n.push(s);n=n.join("/"),o=require,s=o.m[t||0],i=s[n+".js"]||s[n+"/index.js"]||s[n],r='Cannot require("'+n+'")';if(!i)throw Error(r);if(s=i.c)i=o.m[t=s][e=i.m];if(!i)throw Error(r);return i.exports||i(i,i.exports={},function(n){return o("."!=n.charAt(0)?n:e+"/../"+n,t)}),i.exports};
require.m = [];
require.m[0] = { "htmlparser-to-html": {"c":2,"m":"/index.js"},
"jQuery": { exports: window.jQuery },
"lib/common/collection.js": function(module, exports, require){var microee = require('microee');

function Collection(models, options) {
  // Note: needs to be called ".models" for Backbone compatibility (e.g. so that the .pipe method is cross-compatible)
  this.models = models;
  this._options = options;
  // if the models are not instances of options.model, then map them to instances
  if(options.model) {
    this.models = this.models.map(function(item) {
      return (item instanceof options.model ? item : new options.model(item));
    });
  }

}

microee.mixin(Collection);

Collection.prototype.get = function(at) {
  return this.models[at];
};

Collection.prototype.add = function(models, options) {
  var self = this;
  if(!Array.isArray(models)) {
    models = [ models ];
  }

  models.forEach(function(item){
    var index = self.models.length;
    if (self._options && self._options.model && !(item instanceof self._options.model)){
      item = new self._options.model(item);
    }
    self.models.push(item);
    self.emit('add', item, self, { at: index });
  });
};

Collection.prototype.pipe = function(dest) {
  var source = this;
  // pipe the current content
  source.models.forEach(function(model) {
    dest.bind(model);
  })

  // "add" (model, collection, options) — when a model is added to a collection.
  function onAdd(model, collection, options) {
    dest.bind(model, collection, options);
  }
  // "remove" (model, collection, options) — when a model is removed from a collection.
  function onRemove(model, collection, options) {
    dest.remove(model, collection, options);
  }
  // "reset" (collection, options) — when the collection's entire contents have been replaced.
  function onReset(collection, options) {
    dest.reset(collection, options);
  }
  source.on('add', onAdd);
  source.on('remove', onRemove);
  source.on('reset', onReset);

  // + cleanup when cleared
  dest.on('unpipe', function() {
    source.removeListener('add', onAdd);
    source.removeListener('remove', onRemove);
    source.removeListener('reset', onReset);
  });

  dest.emit('pipe', source);
  // allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

module.exports = Collection;
},
"lib/common/collection_view.js": function(module, exports, require){var $ = require('../shim.web.js'),
    Outlet = require('./outlet.js');

/*
 CollectionView is a type of Outlet.

 It adds:
 - the ability specify a child view
 - the ability to respond to collection events (e.g. on add, instantiate a new child view etc.)
*/

function CollectionView(tagName, attributes, content) {
  var self = this;

  // Two ways to define this:
  if(this._render) {
    // 1) object with ._render
    this.outlet = new Outlet(tagName, attributes, content);
  } else {
    // 2) tagName, attributes, content
    Outlet.call(this, tagName, attributes, content);
  }
  // class to instantiate for child views
  this._childView = null;
  this._renderCache = null;
}

Outlet.mixin(CollectionView);

CollectionView.prototype.render = function() {
  if(this._render) {
    // special render(outlet) function
    if(!this._renderCache) {
      this.emit('render');
      this._renderCache = this._render(this.outlet);
    }
    return this._renderCache;
  } else {
    // passthrough
    return Outlet.prototype.render.call(this);
  }
};

CollectionView.prototype.bind = function(model, collection, options) {
  // instantiate a new child view, and bind the model to it
  var view = new this._childView();
  view.bind(model);

  if(this.outlet) {
    this.outlet.add(view, options);
  } else {
    this.add(view, options);
  }
};

// called from the source - note that these are not for direct use;
// operations should be applied on the collection and it's models directly and never on the view itself
CollectionView.prototype.onReset = function() { };
CollectionView.prototype.onRemove = function() {

};

module.exports = CollectionView;
},
"lib/common/outlet.js": function(module, exports, require){var microee = require('microee'),
    $ = require('../shim.web.js');

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
},
"lib/common/table_view.js": function(module, exports, require){
/*
  TableView is a subclass of CollectionView.

  It adds:

  - the ability to sort by a column
  - pagination
  - rendering a visible portion only
  - filtering

  Sorting is done on the underlying collection directly.
  In other words, a click on a sortable column results in
  - a change in the params of the sortBy function on the BB collection
  - a call to collection.sort() to force a re-sort

  Options:

    title: 'Name',
    content: 'name'

*/
},
"lib/common/view.js": function(module, exports, require){var microee = require('microee'),
    $ = require('../shim.web.js'),
    log = require('minilog')('view');

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
  this.on('destroy', function() {
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
    self.emit('unbind', from);
    self.listenTo(to, eventName, callback);
  });
  log.info('listenTo', target, eventName, callback);
  return this;
};

// when the current view is removed/destroyed,
// clean up this DOM listener (via .off with a custom namespace)
View.prototype.listenDom = function(selector, callback) {
  var match = selector.match(delegateEventSplitter),
      eventName = match[1] + '.delegateEvents' + this.id,
      selector = match[2];

  if(typeof jQuery != 'undefined') {
    if (selector === '') {
      jQuery('#' + this.id).on(eventName, callback);
      log.info('listenDom', "jQuery(#"+ this.id+").on("+eventName+", callback)");
    } else {
      jQuery(selector).on(eventName, callback);
      log.info('listenDom', "jQuery("+ selector+").on("+eventName+", callback)");
    }
  }
  return this;
};

// notify the view that it is being destroyed
View.prototype.destroy = function() {
  // emit on this view
  this.emit('unbind');
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
},
"lib/index.web.js": function(module, exports, require){module.exports = {
  Collection: require('./common/collection.js'),
  View: require('./common/view.js'),
  CollectionView: require('./common/collection_view.js'),
  Shim: require('./shim.web.js'),
  Outlet: require('./common/outlet.js'),
  Microee: require('microee')
};
},
"lib/shim.util.js": function(module, exports, require){var microee = require('microee');

exports.isRenderable = function isRenderable(obj) {
  // is it a view or outlet? Duck typing: if it conforms to the expected interface, then it is a view or outlet
  return ['attach', 'render'].every(function(name) {
      return typeof obj[name] == 'function';
    });
}

exports.tag = function(tagName, attributes, value) {
  if(arguments.length == 2) {
    // tag(name, attr, content) can be called as tag(name, content)
    value = attributes;
    attributes = { };
  } else if(arguments.length == 1) {
    // tag(name, attr, content) can be called as tag(name)
    value = '';
    attributes = { };
  }

  function renderValue(value) {
    // value may be one of:
    if(value.render && typeof value.render == 'function' ||
      value.type && value.type == 'tag' ||
      typeof value == 'function') {
      // 1. a view object with a .render() function
      // Note: it used to be that .tag() would cause a render but that is not needed in the new
      // model where every tree of renderables is passed through either `.html()` or `.attach()`
      // 2. a DOM element (or equivalent in the current shim)
      // 3. a function representing a binding
      return value;
    } else if(Array.isArray(value)) {
      // 4. an array of any of the others
      // -> items in the array must be views, DOM elements or other arrays
      // (not strings, since they always need a containing $.tag call)
      return value.map(renderValue);
    } else {
      // 5. a string | date | other primitive
      return { type: 'text', data: value };
    }
  }

  var r = { type: 'tag', name: tagName, attribs: attributes, children: [] };
  if(typeof value != 'undefined') {
    if(value !== '') {
      r.children = [].concat(renderValue(value));
    }
  }

  return r;
};

// Helper function: takes an array of functions and returns a function that applies them all in one step
// Used to combine functions when only one callback is supported
exports.chain = function(fns) {
  return function(input, parent) {
    // apply the map stack on the node
    var result = input,
        i = 0;
    for(; i < fns.length; i++) {
      result = fns[i](result, parent);
    }
    return result;
  };
};

exports.dfsTraverse = function(tree, parentTag, parentView, callback) {
  var nodes = (Array.isArray(tree) ? tree : [tree]),
      // all the initial nodes have a "undefined" parent tag
      parentTags = nodes.map(function() { return parentTag || undefined; }),
      // all the initial nodes have a "undefined" parent view
      parentViews = nodes.map(function() { return parentView || undefined; }),
      tag, view;

  function push(nextParentTag, nextParentView, children) {
    if(Array.isArray(children)) {
      nodes = children.concat(nodes);
      // the current tag is the parent of it's children (duh!)
      parentTags = children.map(function() { return nextParentTag; }).concat(parentTags);
      // the parent view only changes occasionally - when we render things!
      parentViews = children.map(function() { return nextParentView; }).concat(parentViews);
    } else {
      nodes.unshift(children);
      parentTags.unshift(nextParentTag);
      parentViews.unshift(nextParentView);
    }
  }

  // really, when a view is rendered, there are two items:
  // - the object representing the view
  // - the tag (with the same id as the view) from the render which encloses the content of the view

  while(nodes.length > 0) {
    item = nodes.shift();
    parentTag = parentTags.shift();
    parentView = parentViews.shift();

    // item can be one of:
    if(item.render) {
      // 1. Renderable (view)
      var result = item.render();

      // process the current node - there is a current view as well
      callback(result, item, parentTag, parentView);

      if(result.children) {
        // if this item is a renderable, then this item is the next parent
        push(result, item, result.children);
      }
    } else if(item.children) {
      // 2. tag with children

      // process the current node - there is no current view
      callback(item, undefined, parentTag, parentView);

      // push all the child nodes of the current node at the top of the stack
      // since this item is not renderable, parentView is the same for the children as it is for this item
      push(item, parentView, item.children);
    } else if(Array.isArray(item)) {
      // 3. Array of items
      // push these onto the stack - retain the same parentTag, same parentView
      push(parentTag, parentView, item);
    } else {
      // 4. Misc (tag, function etc.)
      // process the current node - there is no current view, no children
      callback(item, undefined, parentTag, parentView);
    }
  }
  return;
};
},
"lib/shim.web.js": function(module, exports, require){var $ = require('jQuery'),
    toHTML = require('htmlparser-to-html'),
    ShimUtil = require('./shim.util.js'),
    log = require('minilog')('shim');

var counter = 1,
    viewById = {};

function Shim(expr) {
  if (!(this instanceof arguments.callee)) {
    return new Shim(expr);
  }
  this.expr = expr;
}

Shim._reset = function() {
  counter = 1;
  viewById = {};
};

// generate one or more unique element ids
Shim.id = function(count) {
  if(isNaN(count)) return 's'+counter++;
  var result = [];
  while(count > 0) {
    result.push('s'+counter++);
    count--;
  }
  return result;
};

// fetch a element from the DOM
Shim.get = Shim.prototype.get = function(token) {
  if(typeof token !== 'string') {
    return token;
  }
  return $('#'+token);
};

// property values (e.g. disabled, checked...)
Shim.prototype.prop = function(name, value) {
  this.get(this.expr).prop(name, value);
}

Shim.prototype.attr = function(name, value) {
  // we will not set the value of the currently focused element to prevent losing the state of the caret
  if(name == 'value' && this.get(this.expr).is(':focus')) return;
  this.get(this.expr).attr(name, value);
}

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

Shim.tag = ShimUtil.tag;
Shim.viewify = function(tagName, attributes, value) {
  // awkward circular dependency on View
  var View = require('./common/view.js'),
      // create a View instance
      result = new View();

  // generate a ._render() function
  result._render = function() {
    if(!attributes) attributes = {};
    if(!attributes.id) attributes.id = Shim.id();
    result.id = attributes.id;
    return Shim.tag('div', attributes, value);
  };
  return result;
};


// replace the inner content of a HTML element
Shim.prototype.update = function(value) {
  var self = this;

  // TODO: emit "destroy" events etc.
  Shim._detach(this.expr, '...?');
  Shim._attach(this.expr, value, function(txt){
    log.info(self.expr, 'update', txt);
    self.get(self.expr).html(txt);
  });
};

// attach as the last child
Shim.prototype.append = function(value) {
  var self = this;
  Shim._attach(this.expr, value, function(txt){
    log.info(self.expr, 'append', txt);
    self.get(self.expr).append(txt);
  });
};

// attach as a sibling just before
Shim.prototype.before = function(value) {
  var self = this;
  Shim._attach(this.expr, value, function(txt){
    log.info(self.expr, 'before', txt);
    self.get(self.expr).before(txt);
  });
};

Shim.prototype.remove = function() {
  this.get(this.expr).remove();
};


function getParamNames(func) {
  var funStr = func.toString();
  return funStr.slice(funStr.indexOf('(')+1, funStr.indexOf(')')).match(/([^\s,]+)/g);
}

// Convert a tree into HTML without attaching it to the DOM
Shim._html = function(tree) {
  return Shim._attach(tree, function() {});
};

// destructive DOM manipulations such as `update()` call this to clean up the DOM
// before replacing into an element
Shim._detach = function(parent, elements) {
  var parentTag = Shim.get(parent);
      parentView = viewById[parent];

  if(parentView) {
    // empty the _renderCache
    delete parent._renderCache;
  }
};

// like .html(), except rather than returning a value,
// this converts the content to html and triggers .attach() on the content
Shim._attach = function(parent, tree, task) {
  // Note: the tree can also be a piece of HTML, so check and handle correctly
  if (typeof tree === 'string') {
    // no need to walk the structure, as HTML strings cannot contain views etc.
    task(tree);
    // DOM: jQuery can handle strings so we can return them directly
    return tree;
  }

  // This can be called at two different points in time:
  // 1. the first time, passing a root level element such as body
  //   => we need to do a full traversal, and do not need to worry about elements already existing
  // 2. incrementally, passing a element reference or element selector id that already exists
  //   => we need to recover the parentview and parentTag values and then do a walk of the new subtree
  //   => if the operation is destructive, we need to call all appropriate destroy etc. calls in the discarded tree

  // Parent is one of: null or an id (TODO: HTML element)
  // Find out if the parent exists - if it does, set the parentView and parentTag values in dfsTraverse
  var origParentTag = undefined, origParentView = undefined;
  if(parent) {
    origParentTag = Shim.get(parent);
    origParentView = viewById[parent];
  }

  // perform a view-axis tree walk, and collect an annotated tag-axis tree
  // 1. trees with a single root:
  // e.g. View( [ text, view, outlet ] )
  // 2. arrays with one or more trees
  // e.g [ text, View([ outlet ]), outlet ]
  var html,
      roots = [],
      delayed = [],
      rootTags = [];
  // note: the dfs traversal tracks the parent tag and parent view separately
  // note: no need to return anything - you can directy annotate the parent
  ShimUtil.dfsTraverse(tree, origParentTag, origParentView, function(tag, view, parentTag, parentView) {
    // Task 1: find the root views (to emit "attach")
    if(view && (!parentView || parentView === origParentView)) {
      // this is a root
      roots.push(view);
      view.parent = null;
      delayed.push(function() {
        // notify each of the tree roots that they have been attached to the DOM
        view.attach();
      });
    }
    // Task 2: connect each **view** to it's parent and each parent to it's children
    if(view && parentView) {
      // assign the parent relationship
      view.parent = parentView;
      // assign the child relationship (???)
      if(!parentView.children) {
        parentView.children = [];
      }
      parentView.children.push(view);
    }
    // Task 3: convert bindings on tag values and tag attributes, using information about the parent view to help
    // Note: any modifications done on the tag is persistent, due to the fact that all structures are cached
    // (for views, via _renderCache, for unrooted HTML via the rootTags array in this function)

    // it's probably best to just look into tag.children directly here rather than waiting for the function to
    // be iterated over in the next step of the dfs.
    // that way, one can always accurately trace the index of the function
    // -- if this were done when accessing the child, then we know what the parent is but not the index of
    // the child in the ._renderCache structure (which is always enclosed by the tag itself)
    if(tag.children) {
      (Array.isArray(tag.children) ? tag.children : [tag.children]).forEach(function(child, index) {
        if(typeof child == 'function') {
          // check if the item is a function (= content binding on the parent)
          // parse the function - retrieve the count and names of the parameters
          var paramNames = getParamNames(child);
          if(!paramNames) {
            // if there are no params, then just run the function once - it never changes
            tag.children[index] = { type: 'text', data: child() };
            return;
          }
          // if it has a binding - it should have an attribs.id
          (tag.attribs) || (tag.attribs = {});
          (tag.attribs.id) || (tag.attribs.id = Shim.id());
          // if there are params, take each of those and permanently replace it with the fixed value
          tag.children[index] = {
            type: 'text',
            data: child.apply(view || parentView, paramNames.map(function(key) { return (view || parentView).model.get(key); }))
          };
          // and add a .listenTo(target, event, fn) to the current view || parent view of the tag
          paramNames.forEach(function(key) {
            (view || parentView).listenTo((view || parentView).model, 'change:'+key, function(model, value, options) {
              log.info('UPDATE', 'change:'+key, value);
              // update the DOM element
              new Shim(tag.attribs.id).update(
                child.apply(view || parentView,
                            paramNames.map(function(key) { return (view || parentView).model.get(key); })));
            });
          });
        }
      });
    }
    // and/or if the tag has an attribute that is a function (= attribute binding on the item)
    if(tag.attribs) {
      // check all attribs
      Object.keys(tag.attribs).forEach(function(key) {
        var fn = tag.attribs[key];
        if(typeof fn == 'function') {
          // if it has a binding - it should have an attribs.id
          (tag.attribs.id) || (tag.attribs.id = Shim.id());
          // parse the function - retrieve the count and names of the parameters
          var paramNames = getParamNames(fn);
          // is this a onX attribute?
          if(key.substr(0, 2).toLowerCase() == 'on') {
            // generate a selector => $(item.id) should work (todo: where does it not work?)
            // always add a .listenDom(selector, fn)
            // note: DOM listeners must always be delayed until "attach"
            (view || parentView).once('attach', function() {
              (view || parentView).listenDom(key.substr(2).toLowerCase()+' #'+tag.attribs.id, fn);
            });
            // delete the function itself from the render cache
            delete tag.attribs[key];
            // todo: assuming for now that onX functions are not also triggered by model change events
            return;
          }
          // regular attribute
          if(!paramNames) {
            // if there are no params, then just run the function once - it never changes
            tag.attribs[key] = fn();
            return;
          }
          // if there are params, take each of those and permanently replace it with the fixed value
          tag.attribs[key] = fn.apply(view || parentView, paramNames.map(function(key) { return (view || parentView).model.get(key); }));
          // and add a .listenTo(target, event, fn) to the current view || parent view of the tag
          paramNames.forEach(function(modelKey) {
            (view || parentView).listenTo((view || parentView).model, 'change:'+modelKey, function(model, value, options) {
              // set the DOM element attribute
              var result = fn.apply(view || parentView, paramNames.map(function(modelKey) { return (view || parentView).model.get(modelKey); }));
              log.info('set attr value', 'change:'+key, '$("'+tag.attribs.id+'").attr("'+key+'", '+result+');');
              Shim.get(tag.attribs.id).attr(key, result);
            });
          });
        }
      });
    }
    // Task 4: update the emulated DOM (SKIP)

    if(view) {
      if(view.id) {
        viewById[view.id] = view;
      }
      if(tag.attribs && tag.attribs.id) {
        viewById[tag.attribs.id] = view;
      }
    }

    // Task 5: collect the complete, annotated HTML (the item.render part is done in the tree walker)
    // this is actually really easy: collect the root tags into an array. That array is renderable as HTML,
    // as long as you redirect any renderables to use the _renderCache instead
    if(!parentTag || (parentTag === origParentTag)) {
      // no parent == root tag
      rootTags.push(tag);
    }
  });

  // Task 6: convert the collected tag-only tree into HTML

  // in Node, we just walk the tree - producing HTML here is not necessary
  html = toHTML(rootTags, null, function(item) {
      if(item.render) {
        if(item._renderCache) {
          return item._renderCache;
        } else {
          var result = item.render();
          // if we have not rendered yet, then do it now -- and update the tagById!!
          if(item.id) {
            viewById[item.id] = item;
          }
          if(result.attribs && result.attribs.id) {
            viewById[result.attribs.id] = item;
          }
          return result;
        }
      }
      return item;
    });

  task(html);

  // run delayed tasks now that the element tree is in the DOM
  for(var i = 0; i < delayed.length; i++) {
    delayed[i]();
  }

  // this fixes the case where an incremental update is made, which just contains tags,
  // so no "attach" events are emitted since there is no root view.
  // the attach listeners are on parentView in this case, so call it.
  if(roots.length == 0 && origParentView) {
    origParentView.emit('attach');
  }

  // return html (so that this can also be used for ".html")
  return html;
};

module.exports = Shim;
},
"microee": {"c":1,"m":"/index.js"},
"minilog": { exports: window.Minilog }};
require.m[1] = { "/index.js": function(module, exports, require){function M() { this._events = {}; }
M.prototype = {
  on: function(ev, cb) {
    this._events || (this._events = {});
    var e = this._events;
    (e[ev] || (e[ev] = [])).push(cb);
    return this;
  },
  removeListener: function(ev, cb) {
    var e = this._events[ev] || [], i;
    for(i = e.length-1; i >= 0 && e[i]; i--){
      if(e[i] === cb || e[i].cb === cb) { e.splice(i, 1); }
    }
  },
  removeAllListeners: function(ev) {
    if(!ev) { this._events = {}; }
    else { this._events[ev] && (this._events[ev] = []); }
  },
  emit: function(ev) {
    this._events || (this._events = {});
    var args = Array.prototype.slice.call(arguments, 1), i, e = this._events[ev] || [];
    for(i = e.length-1; i >= 0 && e[i]; i--){
      e[i].apply(this, args);
    }
    return this;
  },
  when: function(ev, cb) {
    return this.once(ev, cb, true);
  },
  once: function(ev, cb, when) {
    if(!cb) return this;
    function c() {
      if(!when) this.removeListener(ev, c);
      if(cb.apply(this, arguments) && when) this.removeListener(ev, c);
    }
    c.cb = cb;
    this.on(ev, c);
    return this;
  }
};
M.mixin = function(dest) {
  var o = M.prototype, k;
  for (k in o) {
    o.hasOwnProperty(k) && (dest.prototype[k] = o[k]);
  }
};
module.exports = M;
}};
require.m[2] = { "/index.js": function(module, exports, require){var emptyTags = {
  "area": 1,
  "base": 1,
  "basefont": 1,
  "br": 1,
  "col": 1,
  "frame": 1,
  "hr": 1,
  "img": 1,
  "input": 1,
  "isindex": 1,
  "link": 1,
  "meta": 1,
  "param": 1,
  "embed": 1,
  "?xml": 1
};

var ampRe = /&/g,
    looseAmpRe = /&([^a-z#]|#(?:[^0-9x]|x(?:[^0-9a-f]|$)|$)|$)/gi,
    ltRe = /</g,
    gtRe = />/g,
    quotRe = /\"/g,
    eqRe = /\=/g;

function escapeAttrib(s) {
  if(typeof s == 'number' || typeof s == 'boolean') return s.toString();
  if(typeof s != 'string') {
    if(!s.toString || typeof s.toString != 'function') {
      return '';
    } else {
      s = s.toString();
    }
  }
  // Escaping '=' defangs many UTF-7 and SGML short-tag attacks.
  return s.replace(ampRe, '&amp;').replace(ltRe, '&lt;').replace(gtRe, '&gt;')
      .replace(quotRe, '&#34;').replace(eqRe, '&#61;');
}

function html(item, parent, eachFn) {
  // apply recursively to arrays
  if(Array.isArray(item)) {
    return item.map(function(subitem) {
      // parent, not item: the parent of an array item is not the array,
      // but rather the element that contained the array
      return html(subitem, parent, eachFn);
    }).join('');
  }
  var orig = item;
  if(eachFn) {
    item = eachFn(item, parent);
  }
  if(typeof item != 'undefined' && typeof item.type != 'undefined') {
    switch(item.type) {
      case 'text':
        return item.data;
      case 'directive':
        return '<'+item.data+'>';
      case 'comment':
        return '<!--'+item.data+'-->';
      case 'style':
      case 'script':
      case 'tag':
        var result = '<'+item.name;
        if(item.attribs && Object.keys(item.attribs).length > 0) {
          result += ' '+Object.keys(item.attribs).map(function(key){
                  return key + '="'+escapeAttrib(item.attribs[key])+'"';
                }).join(' ');
        }
        if(item.children) {
          // parent becomes the current element
          // check if the current item (before any eachFns are run) - is a renderable
          if(!orig.render) {
            orig = parent;
          }
          result += '>'+html(item.children, orig, eachFn)+(emptyTags[item.name] ? '' : '</'+item.name+'>');
        } else {
          if(emptyTags[item.name]) {
            result += '>';
          } else {
            result += '></'+item.name+'>';
          }
        }
        return result;
      case 'cdata':
        return '<!CDATA['+item.data+']]>';
    }
  }
  console.log('ood', item);

  return item;
}

module.exports = html;
}};
Vjs2 = require('lib/index.web.js');
}());
var $ = require('jQuery'),
    toHTML = require('htmlparser-to-html'),
    ShimUtil = require('../common/shim.util.js'),
    log = require('minilog')('cato/shim'),
    safeGet = ShimUtil.safeGet;

// default log level >= warn
log.suggest.deny('cato/shim', 'info');

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
    // ensure that even if the token is undefined the return value is something you can call
    // jquery functions on
    if(!token || !token.jquery) {
      return $();
    }
    return token;
  }
  return $('#'+token);
};

// property values (e.g. disabled, checked...)
Shim.prototype.prop = function(name, value) {
  this.get(this.expr).prop(name, value);
};

Shim.prototype.attr = function(name, value) {
  // we will not set the value of the currently focused element to prevent losing the state of the caret
  // if(name == 'value' && this.get(this.expr).is(':focus')) return;
  this.get(this.expr).attr(name, value);
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

Shim.tag = ShimUtil.tag;
Shim.viewify = function(tagName, attributes, value) {
  // awkward circular dependency on View
  var View = require('../common/view.js'),
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

  // TODO: Find out what the parent view is, if this is not a view
  // since we need the view to trigger various events on it
  // and for registering event listeners so that they are
  // cleaned up correctly. For example, updating a subelement
  // of a view which has a onClick.

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
  var origParentTag, origParentView;
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
          var v = (view || parentView),
              m = safeGet(v, 'model'),
              paramNames = getParamNames(child);
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
            data: child.apply(v, paramNames.map(function(key) { return safeGet(m, key); }))
          };
          // and add a .listenTo(target, event, fn) to the current view || parent view of the tag
          var m = safeGet(v, 'model');
          if(v && m) {
            paramNames.forEach(function(key) {
              v.listenTo(m, 'change:'+key, function(model, value, options) {
              log.info('Update DOM content id=', tag.attribs.id, 'change:'+key, value);
                // update the DOM element
                new Shim(tag.attribs.id).update(
                  child.apply(view || parentView,
                              paramNames.map(function(key) {
                                // note: need to use the model from the event
                                // otherwise we'll always use the model set in the view or the parent view
                                return safeGet(model, key);
                              })));
              });
            });
          }
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
          var v = (view || parentView),
              m = safeGet(v, 'model');
          if(v && m) {
            paramNames.forEach(function(modelKey) {
              v.listenTo(m, 'change:'+modelKey, function(model, value, options) {
                // set the DOM element attribute
                var result = fn.apply(v, paramNames.map(function(modelKey) {
                  // note: need to use the model from the event
                  // otherwise we'll always use the model set in the view or the parent view
                  return safeGet(model, modelKey);
                }));
                log.info('set attr value', 'change:'+modelKey, '$("'+tag.attribs.id+'").attr("'+key+'", '+result+');');
                new Shim(tag.attribs.id).attr(key, result);
              });
            });
          }
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
  if(roots.length === 0 && origParentView) {
    origParentView.attach();
  }

  // return html (so that this can also be used for ".html")
  return html;
};

module.exports = Shim;

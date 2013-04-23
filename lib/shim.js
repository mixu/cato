var htmlparser = require('htmlparser'),
    toHTML = require('htmlparser-to-html'),
    ShimUtil = require('./shim.util.js');

var dom = { type: 'tag', name: "html", children: [] },
    byId = { body: dom },
    parentById = { body: dom },
    counter = 1;

// takes a piece of HTML and converts it into a emulated DOM object
function objectify(html) {
  var handler = new htmlparser.DefaultHandler(function(error, dom) {
      if(error) throw error;
    }, { verbose: false, ignoreWhitespace: true });
  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(html);
  // silly async/sync hybrid
  return handler.dom;
}

function Shim(expr) {
  if (!(this instanceof arguments.callee)) {
    return new Shim(expr);
  }
  this.expr = expr;
}

Shim.id = function(count) {
  if(isNaN(count)) return counter++;
  var result = [];
  while(count > 0) {
    result.push(counter++);
    count--;
  }
  return result;
};

Shim.get = Shim.prototype.get = function(token) {
  if(!byId[token]) {
    throw new Error('Cannot get element: '+ token);
  }
  return byId[token];
}

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

Shim._reset = function() {
  counter = 1;
};

// used to update the parentById array
function reparent(elements, parent) {
  if(elements.attribs && elements.attribs.id) {
    parentById[elements.id] = parent;
  }
}

// replace the inner content of a HTML element
Shim.prototype.update = function(value) {
  var el = this.get(this.expr);
  if(!el.children) {
    throw new Error('Target element must have a .children property: ' +JSON.stringify(el));
  }

  Shim._attach(value, function(elements){
    // console.log(self.expr, 'update', txt);
    // replace the inner content, no questions asked
    // TODO: does this require "destroy" events etc.?
    el.children = [ elements ];
    reparent(elements, el);
  });
};

// append
Shim.prototype.append = function(value) {
  var el = this.get(this.expr);
  // check the target
  if(!el.children) {
    throw new Error('Target element must have a .children property: ' +JSON.stringify(el));
  }

  Shim._attach(value, function(elements){
    // if `children` is an array, then concat to it, otherwise convert it to a array and then concat
    el.children = (Array.isArray(el.children) ? el.children : [ el.children ]).concat(elements);
    reparent(elements, el);
  });
};

// insert before
Shim.prototype.before = function(value) {

};

function getParamNames(func) {
  var funStr = func.toString();
  return funStr.slice(funStr.indexOf('(')+1, funStr.indexOf(')')).match(/([^\s,]+)/g);
}

Shim.html = function(tree) {
  return Shim._attach(tree, function() {});
    // this is less than optimal since we are re-evaluating the whole content twice
    // ideally, the _attach pass would assign the DOM and model event listeners
    // but that needs the ability to **permanently** alter the content of the _render
    // result rather than only affecting it temporarily

    // TODO: I think the right caching behavior here is:
    // 1. non-views are always re-rendered (e.g. loose html)
    // 2. views are never re-rendered (nor is any html contained within them
    // - so you never go beyond the first level of views if the views have
    //   already been rendered)
    // 3. Both $.html and $.attach do the same thing:
    //    they just delay the DOM-related stuff with .once("attach")
    // 4. During a re-render, it is sufficient to collect the root tags,
    //    and make sure all the root views have been rendered
    //    (- which implies event handlers are waiting for an attach)
};

// like .html(), except rather than returning a value,
// this converts the content to html and triggers .attach()
// on the content
Shim._attach = function(tree, task) {
  // Note: the tree can also be a piece of HTML, so check and handle correctly
  if (typeof tree === 'string') {
    // we need to convert HTML to objects in the Node shim
    tree = objectify(tree);
    // no need to walk the structure, as HTML strings cannot contain views etc.
    task(tree);
    return toHTML(tree);
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
  ShimUtil.dfsTraverse(tree, function(tag, view, parentTag, parentView) {
    // Task 1: find the root views (to emit "attach")
    if(view && !parentView) {
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
              console.log('UPDATE', 'change:'+key, value);
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
          paramNames.forEach(function(key) {
            (view || parentView).listenTo((view || parentView).model, 'change:'+key, function(model, value, options) {
              var result = fn.apply(view || parentView, paramNames.map(function(key) { return (view || parentView).model.get(key); }));
              // set the DOM element attribute
              console.log('set attr value', 'change:'+key, '$("'+tag.attribs.id+'").attr("'+key+'", '+result+');');
            });
          });
        }
      });
    }
    // Task 4: update the emulated DOM
    if(tag) {
      // this task only exists on the Node side
      // It keeps the byId array up to date (parentById is updated in the tasks themselves)
      // This used to take place in the .tag() phase but really, the element doesn't have a DOM
      // addressable ID until it is bound to the DOM
      if(tag.attribs && tag.attribs.id) {
        byId[tag.attribs.id] = tag;
      }
    }

    // Task 5: collect the complete, annotated HTML (the item.render part is done in the tree walker)
    // this is actually really easy: collect the root tags into an array. That array is renderable as HTML,
    // as long as you redirect any renderables to use the _renderCache instead
    if(!parentTag) {
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
          return item.render();
        }
      }
      return item;
    });

  // we only walk the tree to trigger the after actions
  // -- and not for the html (it could be removed completely)
  task(tree);

  // run delayed tasks now that the element tree is in the DOM
  for(var i = 0; i < delayed.length; i++) {
    delayed[i]();
  }

  // return html (so that this can also be used for ".html")
  return html;
};

module.exports = Shim;


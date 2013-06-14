var $ = (typeof window != 'undefined' ? require('../web/shim.js') : require('../shim.js')),
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
  // views by model.cid
  this._viewByModel = {};
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
  var view = new this._childView(),
      outlet = (this.outlet ? this.outlet : this);
  view.bind(model);

  this._viewByModel[model.cid] = view;

  outlet.add(view, options);
};

var oldRemove = CollectionView.prototype.remove;

CollectionView.prototype.remove = function(model, collection, options) {
  // find the view, and remove it
  if(this._viewByModel[model.cid]) {
    if(this.outlet) {
      this.outlet.remove(this._viewByModel[model.cid]);
    } else {
      oldRemove.call(this, this._viewByModel[model.cid]);
    }
  }
};

// called from the source - note that these are not for direct use;
// operations should be applied on the collection and it's models directly and never on the view itself
CollectionView.prototype.onReset = function() { };
CollectionView.prototype.onRemove = function() {

};

module.exports = CollectionView;

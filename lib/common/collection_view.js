var $ = require('../shim.js'),
    Outlet = require('./outlet.js');

/*
 CollectionView is a type of Outlet.

 It adds:
 - the ability specify a child view
 - the ability to respond to collection events (e.g. on add, instantiate a new child view etc.)
*/

function CollectionView(tagName, attributes, content) {
  var self = this;
  Outlet.call(this, tagName, attributes, content);
  // class to instantiate for child views
  this._childView = null;

  // emitted after attached to DOM
  var self = this;
  this.on('attach', function() {
    console.log(self.constructor.name+':attach', self.id);
    // bind DOM events

    // emit "attach" on children
  });
}

Outlet.mixin(CollectionView);

CollectionView.prototype.bind = function(model, collection, options) {
  // instantiate a new child view, and bind the model to it
  var view = new this._childView();
  view.bind(model);
  this.add(view, options);
};

// called from the source - note that these are not for direct use;
// operations should be applied on the collection and it's models directly and never on the view itself
CollectionView.prototype.onReset = function() { };
CollectionView.prototype.onRemove = function() {

};

module.exports = CollectionView;

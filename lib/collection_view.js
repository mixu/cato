var util = require('util'),
    EventEmitter = require('events').EventEmitter;

function CollectionView() {
  this._childView = null;
}

util.inherits(CollectionView, EventEmitter);

// just renders the container
CollectionView.prototype.render = function() {

};

CollectionView.prototype.bind = function(model, collection, options) {
  // instantiate a new child view, and bind the model to it
  var instance = new this._childView();
  instance.bind(model);

  // append the new child view to the collectionView
  this._children.push(instance);
  // and render + append it to the DOM
};

// called from the source - note that these are not for direct use;
// operations should be applied on the collection and it's models directly and never on the view itself
CollectionView.prototype.onReset = function() { };
CollectionView.prototype.onRemove = function() {

};

module.exports = CollectionView;

var microee = require('microee'),
    $ = require('../shim.js');

var states = {
  initial: 1,  // = destroyed (unbound)
  rendered: 2, // = detached from DOM
  attached: 3, // = unbound DOM events
  bound: 4
};

function CollectionView() {
  // class to instantiate for child views
  this._childView = null;
  this._state = states.initial;
  // reference to the DOM fragment object for this view
  this._fragment = null;
}

microee.mixin(CollectionView);

// Render returns DOM elements (or their local equivalent)
CollectionView.prototype.render = function() {
  // if rendered, just return the element
  if(this._state >= states.rendered) {
    return this._fragment;
  }
  // set to rendered
  this._state = states.rendered;
  // if we supported child renders (rather than having them be piped in),
  // this is where you'd chain calls.
  this._fragment = this._el(); // Returns an element, also sets the id
  return this._fragment;
};

CollectionView.prototype.bind = function(model, collection, options) {
  if(this._state < states.rendered) {
    // must be rendered before being bound
    this.render();
  }

  (this._children) || (this._children = []);
  // instantiate a new child view, and bind the model to it
  var child = new this._childView(),
      index = (options && options.at ? options.at : this._children.length);

  child.bind(model);

  // render + append the child to the DOM
  if(this._children.length == 0 || index == this._children.length) {
    // the first insert, and inserting at the last position both need to use .append
    $(this.id).append(child.render());
  } else {
    $(this._children[index].id).before(child.render());
  }

  // then add the new child view to the collectionView
  this._children.splice(index, 0, child);

};

// called from the source - note that these are not for direct use;
// operations should be applied on the collection and it's models directly and never on the view itself
CollectionView.prototype.onReset = function() { };
CollectionView.prototype.onRemove = function() {

};

CollectionView.prototype.attach = function(el) {
  $(el).update(this.render());
  // also, add the DOM event listeners
};

CollectionView.mixin = function(dest) {
  var k;
  for (k in this.prototype) {
    this.prototype.hasOwnProperty(k) && (dest.prototype[k] = this.prototype[k]);
  }
};

module.exports = CollectionView;

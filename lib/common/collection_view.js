var microee = require('microee'),
    $ = require('../shim.js');

function CollectionView() {
  this._childView = null;
  this._state = 'initialized';
}

microee.mixin(CollectionView);

// just renders the container
CollectionView.prototype.render = function() {
  // if rendered, just return the element
  if(this._state == 'rendered') {
    return $.get(this.id);
  }
  // else render
  this._state = 'rendered';
  this.id = $.id();

  var temp = $.el('table', { id: this.id }, []);
  console.log(temp);
  return temp;
};

CollectionView.prototype.bind = function(model, collection, options) {
  if(this._state == 'initialized') {
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

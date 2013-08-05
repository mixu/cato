var Backbone = require('backbone');

var Collection = Backbone.Collection.extend({
  pipe: pipe
});

function pipe(dest) {
  var source = this;
  // pipe the current content
  source.models.forEach(function(model) {
    dest.bind(model);
  });

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
}

module.exports = Collection;

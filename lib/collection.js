var util = require('util'),
    EventEmitter = require('events').EventEmitter;

function Collection(models, options) {
  this._content = models;
  // if the models are not instances of options.model, then map them to instances
  if(options.model) {
    this._content = this._content.map(function(item) {
      return (item instanceof options.model ? item : new options.model(item));
    });
  }

}

util.inherits(Collection, EventEmitter);

Collection.prototype.get = function(at) {
  return this._content[at];
};

Collection.prototype.pipe = function(dest) {
  var source = this;
  // pipe the current content
  source._content.forEach(function(model) {
    dest.bind(model);
  })

  // "add" (model, collection, options) — when a model is added to a collection.
  source.on('add', function(model, collection, options) {
    dest.bind(model, collection, options);
  });

  // "remove" (model, collection, options) — when a model is removed from a collection.
  source.on('remove', function(model, collection, options) {
    dest.remove(model, collection, options);
  });

  // "reset" (collection, options) — when the collection's entire contents have been replaced.
  source.on('reset', function(collection, options) {
    dest.reset(collection, options);
  });

  // + cleanup when cleared

  dest.emit('pipe', source);
  // allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

module.exports = Collection;

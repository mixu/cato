var microee = require('microee');

function Collection(models, options) {
  this._content = models;
  this._options = options;
  // if the models are not instances of options.model, then map them to instances
  if(options.model) {
    this._content = this._content.map(function(item) {
      return (item instanceof options.model ? item : new options.model(item));
    });
  }

}

microee.mixin(Collection);

Collection.prototype.get = function(at) {
  return this._content[at];
};

Collection.prototype.add = function(models, options) {
  var self = this;
  if(!Array.isArray(models)) {
    models = [ models ];
  }

  models.forEach(function(item){
    var index = self._content.length;
    if (self._options && self._options.model && !(item instanceof self._options.model)){
      item = new self._options.model(item);
    }
    self._content.push(item);
    self.emit('add', item, self, { at: index });
  });
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

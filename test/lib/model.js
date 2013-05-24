var microee = require('microee');

function DummyModel(attrs) {
  this._data = attrs;
}

microee.mixin(DummyModel);

DummyModel.prototype.set = function(k, v) {
  this._data[k] = v;
  // emit change.* and change:key
  this.emit('change', this, {});
  this.emit('change:'+k, this, v, {});
  return this;
};

DummyModel.prototype.get = function(k) {
  return this._data[k];
};

DummyModel.mixin = function(dest) {
  var o = DummyModel.prototype, k;
  for (k in o) {
    o.hasOwnProperty(k) && (dest.prototype[k] = o[k]);
  }
};

module.exports = DummyModel;

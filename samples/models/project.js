var microee = require('microee');

function Project(attrs) {
  this._data = attrs;
}

microee.mixin(Project);

Project.prototype.set = function(k, v) {
  this._data[k] = v;
  // emit change.* and change:key
  this.emit('change', this, {});
  this.emit('change:'+k, this, v, {});
  return this;
};

Project.prototype.get = function(k) {
  return this._data[k];
}

module.exports = Project;

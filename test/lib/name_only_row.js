var View = require('cato').View,
    $ = require('cato').Shim;

function ItemView() {
  View.call(this);
}

View.mixin(ItemView);

ItemView.prototype._render = function() {
  var model = this.model;
  this.id = $.id();
  return $.tag('li', { id: this.id }, function(name) { return name; });
};

module.exports = ItemView;

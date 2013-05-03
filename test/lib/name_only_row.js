var View = require('vjs2').View,
    $ = require('vjs2').Shim;

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

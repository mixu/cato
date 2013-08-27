var View = Cato.View,
    $ = Cato.Shim;

function ItemView() {
  View.call(this);
  this.content = '';
}

View.mixin(ItemView);

ItemView.prototype._render = function() {
  this.id = $.id();
  return $.tag('tr', { id: this.id }, this.content);
};

ItemView.prototype.bind = ...;

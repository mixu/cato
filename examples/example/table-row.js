var View = require('cato').View,
    $ = require('cato').Shim;

function RowView() {
  View.call(this);
}

View.mixin(RowView);

RowView.prototype._render = function() {
  this.id = $.id();
  return $.tag('tr', { id: this.id }, [
    $.tag('td', function(name) { return name; }),
    $.tag('td', function(modified) { return modified; }),
  ]);
};

module.exports = RowView;

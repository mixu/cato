var View = require('../../index.js').View,
    $ = require('../../index.js').Shim;

function PlaceholderView(text) {
  View.call(this);
  this.text = text;
}

View.mixin(PlaceholderView);

PlaceholderView.prototype._render = function() {
  this.id = $.id();
  return $.tag('p', { id: this.id }, this.text);
};

module.exports = PlaceholderView;

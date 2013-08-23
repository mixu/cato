var View = require('cato').View,
    $ = require('cato').Shim;

function ExampleView() {
  View.call(this);
}

View.mixin(ExampleView);

ExampleView.prototype._render = function() {
  this.id = $.id();
  return $.tag('p', { id: this.id }, function(name) {
    return 'Hello ' + (name ? name : 'world') + '!'
  });
};

module.exports = ExampleView;

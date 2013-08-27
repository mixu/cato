var View = require('cato').View,
    $ = require('cato').Shim;

function ExampleView() {
  View.call(this);
}

View.mixin(ExampleView);

ExampleView.prototype._render = function() {
  this.id = $.id();
  return $.tag('div', { id: this.id }, [
    $.tag('h2', function(name) {
      return 'Hello ' + (name ? name : 'world') + '!'
    }),
    $.tag('p', [
      'Name:',
      $.tag('input', {
        value: function(name) { return name; }
      }, '')
    ])
  ]);
};

module.exports = ExampleView;

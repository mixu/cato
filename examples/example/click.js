var View = require('cato').View,
    $ = require('cato').Shim;

function TestView() {
  View.call(this);
};

View.mixin(TestView);

TestView.prototype.render = function() {
  var self = this;
  return $.tag('div', [
      $.tag('div', function(count) {
        return 'Clicks: ' + count;
      }),
      $.tag('button', {
        onclick: function() {
          self.increment();
          return false;
        }
      }, 'Click me')
    ]);
};

TestView.prototype.increment = function() {
  var model = this.model;
  model.set('count', model.get('count') + 1);
};

module.exports = TestView;

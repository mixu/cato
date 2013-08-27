var $ = Cato.Shim;

function TestView() {};

Cato.View.mixin(TestView);

TestView.prototype.render = Cato.template('./click.jade');

TestView.prototype.increment = function() {
  var model = this.model;
  model.set('count', model.get('count') + 1);
};

module.exports = TestView;

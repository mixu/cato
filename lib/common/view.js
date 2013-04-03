var microee = require('microee'),
    $ = require('../shim.js');

function View() {

}

microee.mixin(View);

View.prototype.bind = function(model) {
  this.model = model;
  // establish subscriptions from the model change events to the value bindings (in the DOM)
  // and any wildcard event handlers for the model
};

// .render() is implemented by each subclass

View.prototype.attach = function(el) {
  $(el).update(this.render());
  // also, add the DOM event listeners
};

View.mixin = function(dest) {
  var k;
  for (k in this.prototype) {
    this.prototype.hasOwnProperty(k) && (dest.prototype[k] = this.prototype[k]);
  }
};

module.exports = View;

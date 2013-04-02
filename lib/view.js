var util = require('util'),
    EventEmitter = require('events').EventEmitter;

function View() {

}

util.inherits(View, EventEmitter);

View.prototype.bind = function(model) {
  // establish subscriptions from the model change events to the value bindings (in the DOM)
  // and any wildcard event handlers for the model
};

// .render() is implemented by each subclass

View.prototype.attach = function(el) {
  $(el).update(this.render());
  // also, add the DOM event listeners
};

module.exports = View;

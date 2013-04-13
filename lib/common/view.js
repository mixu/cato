var microee = require('microee'),
    $ = require('../shim.js');

/*
    Create

    Pipe data into view (doesn't have it's own state, since cleanup is based on an event)
      => attach event handlers on models and collections
          - the event handlers are attached by pipe(),
            which also attaches a handler on the "unpipe?" event
            which is responsible for the cleanup work

    Render
      => to fragment, assign concrete ids
          - the view can hold on to a reference to the fragment,
            since it will never change during it's lifetime
            (make sure to delete the ref on destroy)
      <= Render calls on children

    Attach to DOM
        - Only one call to actually attach to the DOM,
          at the top level of the hierarchy
        - Need to do this before binding events (?)
      <= set children to attached as well

    Bind events on DOM
        - e.g. Backbone has delegateEvents which maps selectors to view instance method calls
        - Beyond method calls on a view, it's worth using events + up/down/all in a tree (1-n, name independent)
          rather than named functions on named objects (which are 1-1 and name/context dependent)
      <= and do the same for each child

    Detach (e.g. a conditional view which gets swapped out)
      => retain the DOM fragment
      => set children to detached as well

    Destroy
      => unbind DOM event handlers (e.g. undelegateEvents)
      => detach event handlers on models and collections (e.g. trigger "unpipe" event handler)
*/

var states = {
  initial: 1,  // = destroyed (unbound)
  rendered: 2, // = detached from DOM
  attached: 3, // = unbound DOM events
  bound: 4
};

function View() {
  var self = this;
  this._state = states.initial;

  // emitted after attached to DOM
  this.on('attach', function() {
    console.log(self.constructor.name+':attach', self.id);
    // bind DOM events

    if(this.domEvents) {
      console.log('attaching dom events', this.domEvents);
      this.domEvents.forEach(function(evt) {
        $(evt.selector).on('click', evt.cb);
      });
    }

    // emit "attach" on children
  });
}

microee.mixin(View);

View.prototype.bind = function(model) {
  this.model = model;
  // establish subscriptions from the model change events to the value bindings (in the DOM)
  // and any wildcard event handlers for the model
};

// .render() is implemented by each subclass

View.prototype.toggle = function(visible) {
  this.id && $(this.id).toggle(visible);
};

View.mixin = function(dest) {
  var k;
  for (k in this.prototype) {
    this.prototype.hasOwnProperty(k) && (dest.prototype[k] = this.prototype[k]);
  }
};

module.exports = View;

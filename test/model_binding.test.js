var assert = require('assert'),

    PlaceholderView = require('./lib/placeholder.js'),
    Outlet = require('vjs2').Outlet,
    $ = require('vjs2').Shim,
    Model = require('./lib/model.js');

var id = 1000;

function instrument(view, bindCalls, viewEvents, listenerCalls) {
  view.on('render', function() {
        viewEvents.push('render');
      }).on('attach', function() {
        viewEvents.push('attach');
      });
  var oldListenTo = view.listenTo;
  view.listenTo = function(target, eventName, callback) {
    var callId = id++;
    bindCalls.push([ 'listenTo', callId, target, eventName, callback ]);
    return oldListenTo.call(this, target, eventName, function() {
      var args = Array.prototype.slice.call(arguments, 0);
      listenerCalls.push([ 'model', callId, eventName, callback, args ]);
      return callback.apply(this, args);
    });
  };
  var oldListenDom = view.listenDom;
  view.listenDom = function(selector, callback) {
    var callId = id++;
    bindCalls.push([ 'listenDom', callId, selector, callback ]);
    return oldListenDom.call(this, selector, function() {
      var args = Array.prototype.slice.call(arguments, 0);
      listenerCalls.push([ 'DOM', callId, selector, callback, args]);
      return callback.apply(this, args);
    });
  };
}

exports['model bindings'] = {

  beforeEach: function() {
    $._reset();
  },

  // [point to bind to]
  //    <= [operation to perform] = [expression to calculate](events that cause expression to trigger)
  // Where the operation is:
  // - value.set(result)
  // - set.toggle(result)
  // - object.set(key, value)
  // The expression is any function that returns a value.
  //

  // the value can obviously be text, tags, views or outlets (that's tested elsewhere)

  // 1. "content binding": a function that computes the (text) content of a tag from one or more model properties
  // - should be run on "render"
  // - should add event listeners on "attach"
  // - should detach event listeners on "destroy"

  'function on a tag': function() {
    var el = $.tag('div', {}, function() {
      return 'Foo';
    });

    $('body').update(el);
//    console.log($.get('body'));
    // a) should be run on "render"
    assert.equal($.html($.get('body')), '<html><div>Foo</div></html>');
  },

  /*
    $.tag('p', {}, (model.get('sample_records') / model.get('source_records')).toFixed(2) + '% of source set');

    With a little bit of trickery, we can extract the function parameter names from the source:

    $.tag('p', {}, function(sample_records, source_records) {
      return (sample_records / source_records).toFixed(2) + '% of source set';
    });

    This should be equivalent to the much more verbose:

    $.tag('p', {}, function() {
          var value = (function(sample_records, source_records) {
            return (sample_records / source_records).toFixed(2) + '% of source set';
          }).call(self, self.model.get('sample_records'), self.model.get('source_records'));
          $(tag.id).update(value);
        });
    // where the deps (sample_records, source_records) get converted into subscriptions:
    // .on("attach", function() { self.model.on('change:'+dep, fn); });
    // .on("destroy", function() { self.model.removeListener('change:'+dep, fn); }))

  */

  'function with model listeners': function() {
    var evalCount = 0,
       view = $.viewify('div', {}, function(foo) {
        console.log('eval', foo);
        evalCount++;
        return 'The value is ' + foo;
      }),
      bindCalls = [], viewEvents = [], listenerCalls = [];
    // instrument view
    instrument(view, bindCalls, viewEvents, listenerCalls);

    var model = new Model({ foo: 'Foo'});
    // must bind before render
    view.bind(model);

    // attach to DOM
    $('body').update(view);

    // assert that the function was rendered (a: should be run on "render")
    assert.ok(evalCount > 0);
    // assert that DOM events were attached on "attach"
    assert.ok(bindCalls.some(function(item) {
      return item[0] == 'listenTo' && item[3] == 'change:foo';
    }));

    assert.equal($.html($.get('body')), '<html><div id="1">The value is Foo</div></html>');
    console.log($.html($.get('body')));
    model.set('foo', 'Bar');
    console.log($.html($.get('body')));
    assert.equal($.html($.get('body')), '<html><div id="1">The value is Bar</div></html>');
    console.log(bindCalls, viewEvents, listenerCalls);
  },


  // 2. "attribute binding": a function that computes the value of an attribute from one or more model properties
  // - should be run on "render"
  // - should add event listeners on "attach"
  // - should detach event listeners on "destroy"
  'function as attribute binding': function() {
    var view = $.viewify('div', { class: function(foo) { return 'sort-'+foo; } }, 'Text'),
      bindCalls = [], viewEvents = [], listenerCalls = [];
    // instrument view
    instrument(view, bindCalls, viewEvents, listenerCalls);

    var model = new Model({ foo: 'Foo'});
    // must bind before render
    view.bind(model);

    // attach to DOM
    $('body').update(view);
    console.log($.html($.get('body')));

    console.log(bindCalls, viewEvents, listenerCalls);
  },

  // 3. "onX attribute binding": a function that responds to DOM events
  // - should cause a DOM event listener to be registered

  'function as onX attribute binding': function() {
    var view = $.viewify('div', { onclick: function() {
        console.log('clicked!');
      }}, 'Bar'),
      bindCalls = [], viewEvents = [], listenerCalls = [];
    // instrument view
    instrument(view, bindCalls, viewEvents, listenerCalls);

    // attach to DOM
    $('body').update(view);
    console.log($.html($.get('body')));
    console.log(bindCalls, viewEvents, listenerCalls);
  },


  // Specialty bindings

  // 4. "2-way form value binding": a function that bounds to the "value" attribute on one of the following tags:
  // - input[text], input[password], textarea, select
  // - should work as a two-way binding (e.g. it should also generate DOM change event
  //   handlers/listeners, as well as the normal model event listeners)

  // 5. "CSS attribute value binding": Toggling a CSS attribute, such as "display:" / recalculating a CSS attribute.
  // CSS attributes are like individual, orthogonal attributes, but they are applied as a single
  // underlying string in the DOM rather than being direct attributes.

  // 6. "CSS class toggling binding": Adding and removing classes. Classes work like sets of strings, there can be multiple
  // handlers that either apply or remove a class to the "class" attribute.
  // Note that there can be multiple bindings.
  // Note that these may be in addition to a static set of classes.

};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}

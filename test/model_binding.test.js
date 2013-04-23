var assert = require('assert'),

    PlaceholderView = require('./lib/placeholder.js'),
    Outlet = require('vjs2').Outlet,
    $ = require('vjs2').Shim,
    Model = require('./lib/model.js');

exports['model bindings'] = {

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
    var currentState = 'none',
        evalCount = 0;
    var view = $.viewify('div', {}, function(foo) {
        console.log('eval', foo);
        evalCount++;
        return 'The value is ' + foo;
      }).on('render', function() {
        console.log('render');
        currentState = 'render';
      }).on('attach', function() {
        console.log('attach');
        currentState = 'attach';
      });

    var model = new Model({ foo: 'Foo'});
    // must bind before render
    view.bind(model);

    // attach to DOM
    $('body').update(view);

    // assert that the function was rendered (a: should be run on "render")
    assert.ok(evalCount > 0);
    // assert that DOM events were attached on "attach"
    // e.g. that calls like this: $(evt.selector).on('click', evt.cb);
    // were made

    // the question is, where to store all this stuff
    // -> probably best make all the bound events an explicit
    //    property of the renderable object, since that makes it much easier to
    //    make assertions about the renderable. Implicit e.g. .on('destroy')
    //    handlers are harder to assert about. -- actually since one can instrument that call it's fine

    assert.equal($.html($.get('body')), '<html><div id="1">The value is Foo</div></html>');
    console.log($.html($.get('body')));
    model.set('foo', 'Bar');
    console.log($.html($.get('body')));
    assert.equal($.html($.get('body')), '<html><div id="1">The value is Bar</div></html>');
  },


  // 2. "attribute binding": a function that computes the value of an attribute from one or more model properties
  // - should be run on "render"
  // - should add event listeners on "attach"
  // - should detach event listeners on "destroy"

  // 3. "onX attribute binding": a function that responds to DOM events
  // - should cause a DOM event listener to be registered

  'function with onX attribute binding': function() {
    var view = $.viewify('div', { onclick: function() {
        console.log('clicked!');
      }}, 'Bar').on('render', function() {
        console.log('render');
        currentState = 'render';
      }).on('attach', function() {
        console.log('attach');
        currentState = 'attach';
      });

    // attach to DOM
    $('body').update(view);
    console.log($.html($.get('body')));
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

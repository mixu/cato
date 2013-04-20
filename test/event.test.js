var assert = require('assert'),

    PlaceholderView = require('./lib/placeholder.js'),
    Outlet = require('vjs2').Outlet,
    $ = require('vjs2').Shim;

/*
  There are certain events that must be triggered during the view lifecycle.

  Views:
    - "render": emitted when render is called on a view.
    - "attach": when the top-level view is attached to the DOM, "attach" is emitted on all of it's children.
       Attach should also expose a reference to the element.
    - "detach": when the top-level view is removed from the DOM
    - "show": when the view, or it's ancestor changes visibility to visible
    - "hide":  when the view, or it's ancestor changes visibility to hidden
*/

exports['event tests -'] = {
  'render event is emitted on a view': function(done) {
    var item = new PlaceholderView('Hello'),
        events = [];

    item.once('render', function() {
      events.push('render');
      assert.ok(events.some(function(item) { return item == 'render'; }));
      done();
    });

    $.html(item);
  },

  'render event is emitted on a outlet': function(done) {
    var item = new Outlet('span', {}, 'Foo'),
        events = [];

    item.once('render', function() {
      events.push('render');
      assert.ok(events.some(function(item) { return item == 'render'; }));
      done();
    });

    $.html(item);
  },

  'attach event is emitted on a view': function(done) {
    var item = new PlaceholderView('Hello'),
        events = [];

    item.once('render', function() {
      events.push('render');
    });

    item.once('attach', function() {
      events.push('attach');
      assert.ok(events.some(function(item) { return item == 'render'; }));
      assert.ok(events.some(function(item) { return item == 'attach'; }));
      done();
    });

    // attach is always invoked with the top level element
    $('body').update(item);
  },

  'attach event is emitted on a outlet': function(done) {
    var item = new Outlet('span', {}, 'Foo'),
        events = [];

    item.once('render', function() {
      events.push('render');
    });

    item.once('attach', function() {
      events.push('attach');
      assert.ok(events.some(function(item) { return item == 'render'; }));
      assert.ok(events.some(function(item) { return item == 'attach'; }));
      done();
    });

    // attach is always invoked with the top level element
    $('body').update(item);
  }
};


/*

  Tags, arrays and outlets can contain other renderables, so test:

  - tag + (array, outlet, view, tag, string)
  - array + (array, outlet, view, tag, string)
  - outlet + (array, outlet, view, tag, string)

  where the input array contains an outlet, a view and a tag.

  Views do not have a default way of specifying content, though they can obviously use the other components.
*/

exports['event tests - nested events'] = {

  beforeEach: function() {
    var self = this;
    var events = this.events = [];

    function listen(name, item) {
      item.on('attach', function() { self.events.push([ 'attach', name ]); });
      item.on('render', function() { self.events.push([ 'render', name ]); });
    }
    var a = new PlaceholderView('Placeholder'),
        b = new Outlet('table', {}, 'Outlet'),
        c = new PlaceholderView('Placeholder2'),
        d = new Outlet('table', {}, 'Outlet2');

    listen('a', a);
    listen('b', b);
    listen('c', c);
    listen('d', d);

    this.input = [
            '<div>a</div>', $.tag('h1', {}, 'Foo'), a, b,
          [ '<div>b</div>', $.tag('h2', {}, 'Foo2'), c, d ]
        ];

    this.check = function() {
      ['a', 'b', 'c', 'd'].forEach(function(name) {
        assert.ok(events.some(function(item) { return item[0] == 'render' && item[1] == name; }));
        assert.ok(events.some(function(item) { return item[0] == 'attach' && item[1] == name; }));
      });
    };
  },

  'attach and render events are emitted on an tag, and all its content descendants': function() {
    // attach is always invoked with the top level element
    $('body').update($.tag('body', {}, this.input));
    // console.log(this.events);
    this.check();
  },


  'attach and render events are emitted on an array, and all its descendants': function() {
      $('body').update(this.input);
    this.check();
  },

  'attach and render events are emitted on a outlet, and all its descendants': function() {
      $('body').update(new Outlet('body', {}, this.input));
    this.check();
  }
};

// outlet special events
// - view is added
// - view is removed
// - outlet is reset

exports['event tests - outlet'] = {
  'render, attach and destroy events are emitted when new items are added and removed in an outlet': function() {
    var a = new PlaceholderView('Foobar'),
        b = new PlaceholderView('Foobar2'),
        c = new PlaceholderView('Header view'),
        outlet = new Outlet('foo', {}, c),
        events = [];

    function listen(name, item) {
      item.on('render', function() { events.push([ 'render', name ]); });
      item.on('attach', function() { events.push([ 'attach', name ]); });
      item.on('destroy', function() { events.push([ 'destroy', name ]); });
    }

    listen('a', a);
    listen('b', b);
    listen('c', c);
    listen('outlet', outlet);

      $('body').update(outlet);

    outlet.add(a);
    outlet.add(b);
    outlet.remove(a);
    outlet.remove(b);

    // console.log(events);
    ['a', 'b'].forEach(function(name) {
      assert.ok(events.some(function(item) { return item[0] == 'render' && item[1] == name; }));
      assert.ok(events.some(function(item) { return item[0] == 'attach' && item[1] == name; }));
      assert.ok(events.some(function(item) { return item[0] == 'destroy' && item[1] == name; }));
    });
  }
};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}

var assert = require('assert'),
    pretty = require('html').prettyPrint,

    PlaceholderView = require('../lib/placeholder.js'),
    Outlet = require('cato').Outlet,
    $ = require('cato').Shim,
    Collection = require('cato').Collection,
    CollectionView = require('cato').CollectionView,
    Model = require('backbone').Model,
    NameOnlyRow = require('../lib/name_only_row.js');

/*
  CollectionView use cases:

  1) Single wrapping element around a Outlet
  2) Render method wrapping around a Outlet

  CollectionView tests:

  0) Can render the collection
  1) Adding an element to the collection should be reflected in the view
  2) Changing an element property should be reflected in the view
  3) Removing an element from the collection should be reflected in the view
  4) Resetting the collection should reset the view

*/

function makeRe(expr) {
  return new RegExp(expr.replace(/#/g, '[0-9]+').replace(/\//g, '\/'));
}

function SimpleUlCollectionView() {
  CollectionView.call(this, 'ul', { }, '');
  this._childView = NameOnlyRow;
}

CollectionView.mixin(SimpleUlCollectionView);

exports['given a collection'] = {

  'single wrapping element': function() {

    // define class

    function TableView() {
      CollectionView.call(this, 'ul', { }, '<li>Header</li>');
      this._childView = NameOnlyRow;
    }

    CollectionView.mixin(TableView);

    // use
    var tableView = new TableView(),
        table = new Collection([
          { name: 'Project Vega', records: 4834,  last_modified: new Date() }
        ], { model: Model });

    // render before piping
    // 0) Can render the collection (empty)
    assert.equal($.html(tableView), '<ul id="1"><li>Header</li></ul>');

    // 0) Can render the collection (after .pipe())
    table.pipe(tableView);
    assert.equal($.html(tableView), '<ul id="1"><li>Header</li><li id="2">Project Vega</li></ul>');

    // 1) Adding an element to the collection should be reflected in the view
    table.add({name: 'Project Foo', records: 123,  last_modified: new Date() });
    assert.equal($.html(tableView), '<ul id="1"><li>Header</li><li id="2">Project Vega</li><li id="3">Project Foo</li></ul>');

    // 2) Changing an element property should be reflected in the view
    table.at(1).set('name', 'Project Bar');
    assert.equal($.html(tableView), '<ul id="1"><li>Header</li><li id="2">Project Vega</li><li id="3">Project Bar</li></ul>');

    // 3) Removing an element from the collection should be reflected in the view
    table.remove(table.at(1));
    // console.log($.html(tableView));
    assert.equal($.html(tableView), '<ul id="1"><li>Header</li><li id="2">Project Vega</li></ul>');
    // 4) Resetting the collection should reset the view
  },

  'render method wrapper': function() {
    // define class

    function TableView() {
      CollectionView.call(this, 'ul', {}, '');
      this._childView = NameOnlyRow;
    }

    CollectionView.mixin(TableView);

    TableView.prototype._render = function(outlet) {
      this.id = $.id();

      return $.tag('section', { id: this.id }, [
          $.tag('p', { }, 'Header'),
          // outlet
          outlet,
          $.tag('div', { }, 'Footer')
        ]);
    };

    // use
    var tableView = new TableView(),
        table = new Collection([
          { name: 'Project Vega', records: 4834,  last_modified: new Date() }
        ], { model: Model });

    // render before piping
    // 0) Can render the collection (empty)
    assert.equal($.html(tableView), '<section id="5"><p>Header</p><ul id="4"></ul><div>Footer</div></section>');

    // 0) Can render the collection (after .pipe())
    table.pipe(tableView);
    assert.equal($.html(tableView), '<section id="5"><p>Header</p><ul id="4"><li id="6">Project Vega</li></ul><div>Footer</div></section>');
    // 1) Adding an element to the collection should be reflected in the view
    table.add({name: 'Project Foo', records: 123,  last_modified: new Date() });
    assert.equal($.html(tableView), '<section id="5"><p>Header</p><ul id="4"><li id="6">Project Vega</li><li id="7">Project Foo</li></ul><div>Footer</div></section>');
    // 2) Changing an element property should be reflected in the view
    table.at(1).set('name', 'Project Bar');
    assert.equal($.html(tableView), '<section id="5"><p>Header</p><ul id="4"><li id="6">Project Vega</li><li id="7">Project Bar</li></ul><div>Footer</div></section>');

  },

  'sort with comparator - no explicit .sort()': function() {
    var tableView = new SimpleUlCollectionView(),
        collection = new Collection([
          { name: 'z' },
          { name: 'm' },
          { name: 'a' }
        ], { comparator: function(a, b) {
              return a.get('name').localeCompare(b.get('name'));
        } }),
        val, re;

    /*
    collection.on('all', function(name) {
      console.log(Array.prototype.slice.apply(arguments));
    });
    */

    // *Must* render before piping!
    $.html(tableView);
    collection.pipe(tableView);
    re = makeRe('<ul id="#"><li id="#">a</li><li id="#">m</li><li id="#">z</li></ul>');
    assert.deepEqual(collection.pluck('name'), [ 'a', 'm', 'z']);
    assert.ok(re.test($.html(tableView)));

    collection.add({ name: 'b' });

    console.log(collection.pluck('name'));

    val = $.html(tableView),
    re = makeRe('<ul id="#"><li id="#">a</li><li id="#">b</li><li id="#">m</li><li id="#">z</li></ul>');
    console.log(val);
    assert.deepEqual(collection.pluck('name'), [ 'a', 'b', 'm', 'z']);
    assert.ok(re.test(val));
  }

};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}

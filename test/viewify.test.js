var assert = require('assert'),

    PlaceholderView = require('./lib/placeholder.js'),
    Outlet = require('vjs2').Outlet,
    $ = require('vjs2').Shim;

/*
  .viewify(tag, attr, input): return a View *instance* consisting of the content,
    wrapped in the given tag. The main use case is to avoid having to define custom
    view classes just to use a bespoke group of tags inside a Outlet, which expects a view-like thing as it's input.

  `input` is one of:
  - a HTML string
  - a tag
  - an array of: HTML strings, tags, views and outlets
  - (it doesn't make sense to viewify a View or a Outlet)

*/

exports['viewify -'] = {
  'can viewify a string': function() {
    $._reset();
    var result = $.viewify('div', {}, '<p>Foo</p>'),
        asHtml = $.html(result.render());
    assert.equal(typeof result.render, 'function');
    assert.ok(result.id);
    // console.log(asHtml);
    assert.equal(asHtml, '<div id="1"><p>Foo</p></div>')
  },

  'can viewify a tag': function() {
    $._reset();
    var result = $.viewify('div', {}, $.tag('div', { id: 100 }, 'Hello')),
        asHtml = $.html(result.render());
    assert.equal(typeof result.render, 'function');
    assert.ok(result.id);
    // console.log(asHtml);
    assert.equal(asHtml, '<div id="1"><div id="100">Hello</div></div>')
  },

  'can viewify an array of renderables': function() {
    $._reset();
    var result = $.viewify('div', {}, [
            // html string
            '<p>Foo</p>',
            // tag
            $.tag('h1', {}, 'Bar'),
            // view
            new PlaceholderView('Placeholder'),
            // outlet
            new Outlet('table', {}, 'Outlet'),
            // array of the above
            [
              '<p>Foo2</p>',
              $.tag('h2', {}, 'Bar'),
              new PlaceholderView('Placeholder2'),
              new Outlet('table', {}, 'Outlet2'),
            ]
          ]),
        asHtml = $.html(result.render());
    assert.equal(typeof result.render, 'function');
    assert.ok(result.id);
    // console.log(asHtml);
    assert.equal(asHtml,
      '<div id="3">'+
        '<p>Foo</p>'+
        '<h1>Bar</h1>'+
        '<p id="4">Placeholder</p>'+
        '<table id="1">Outlet</table>'+
        '<p>Foo2</p>'+
        '<h2>Bar</h2>'+
        '<p id="5">Placeholder2</p>'+
        '<table id="2">Outlet2</table>'+
      '</div>')
  }

};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}

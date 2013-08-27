var assert = require('assert'),
    Outlet = require('cato').Outlet,
    $ = require('cato').Shim,
    View = require('cato').View,
    Model = require('backbone').Model;


function TestView(name) {
  View.call(this);
  this.name = name;
}

View.mixin(TestView);

TestView.prototype._render = function() {
  return $.tag('p', { id: this.id }, this.name);
};

function makeRe(expr) {
  return new RegExp(expr.replace(/#/g, '[0-9]+').replace(/\//g, '\/'));
}

exports['outlet'] = {

  'when a "sort" event is received, update the html to match the collection': function() {
    var outlet = new Outlet('ul', {}, ''),
        val, re,
        a = new TestView('a'),
        b = new TestView('b'),
        c = new TestView('c');

    a.id = $.id();
    b.id = $.id();
    c.id = $.id();

    assert.ok(makeRe('<ul id="#"></ul>').test($.html(outlet.render())));

    outlet.add(c);
    outlet.add(b);
    outlet.add(a);

    console.log($.html(outlet.render()));
    // console.log(outlet);

    assert.ok(makeRe('<ul id="#"><p id="#">c</p><p id="#">b</p><p id="#">a</p></ul>').test($.html(outlet.render())));
    outlet.reorder([ a, b, c]);
    console.log($.html(outlet.render()));
    assert.ok(makeRe('<ul id="#"><p id="#">a</p><p id="#">b</p><p id="#">c</p></ul>').test($.html(outlet.render())));
    // console.log(outlet);
  }

};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}

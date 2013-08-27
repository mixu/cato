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
  return $.tag('p', this.name);
};



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

    console.log($.html(outlet.render()));

    outlet.add(c);

    console.log($.html(outlet.render()));

    outlet.add(b);
    console.log($.html(outlet.render()));

  }

};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}

var util = require('util'),
    assert = require('assert'),
    $ = require('../index.js').Shim;

module.exports['tests'] = {

  'it works': function() {

    console.log($.objectify('<p>Foo</p>'));

  }
};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}

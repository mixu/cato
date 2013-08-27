var util = require('util'),
    assert = require('assert');

var Parser = require('jade').Parser,
    $ = require('cato').Shim,
    compiler = require('cato').Jade;

var cases = {

  'basic': [
    [
      'html',
      '  body',
      '    h1 Title'
    ], [
      $.tag('html',
        $.tag('body',
          $.tag('h1', 'Title')))
    ]
  ],

  'attrs-data': [
    [
      "foo(data-user=user)",
      "foo(data-items=[1,2,3])",
      "foo(data-username='tobi')"
    ], [
      $.tag('foo', { 'data-user': 'user' }, ''),
      $.tag('foo', { 'data-items': '[1,2,3]'}, ''),
      $.tag('foo', { 'data-username': 'tobi'}, '')
    ]
  ],

  'block-expansion.shorthands': [
    [
      'ul',
      '  li.list-item: .foo: #bar baz',
    ], [
      $.tag('ul',
        $.tag('li', { class: 'list-item'},
          $.tag('div', { class: 'foo'},
            $.tag('div', { id: 'bar' }, 'baz'))))
    ]
  ]

};


function parse(original) {
  return compiler.convert(original);
}

// this generates the exports tests
Object.keys(cases).forEach(function(testName) {
  var original = cases[testName][0].join('\n'),
      expected = cases[testName][1];

  exports[testName] = function() {
//    console.log(diff.compare(parse(original), expected));
    var result = parse(original);
    console.log('\nResult:');
    console.log(util.inspect(result, null, 20, true));
    console.log('\nExpected:');
    console.log(util.inspect(expected, null, 20, true));

    assert.deepEqual(result, expected);

    var code = compiler.render(result),
        evaled = code.map(function(c) { return eval(c) });

    console.log(code);
    console.log(util.inspect(evaled, null, 20, true));

    assert.deepEqual(result, evaled);
  }
});


// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}

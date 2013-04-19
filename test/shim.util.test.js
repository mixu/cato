var util = require('util'),
    assert = require('assert'),
    $ = require('../lib/shim.js'),
    ShimUtil = require('../lib/shim.util.js'),
    toHTML = require('htmlparser-to-html'),
    PlaceholderView = require('./lib/placeholder.js'),
    Outlet = require('../index.js').Outlet;


module.exports['shim util tests'] = {

/*
  Should work on this:

         / 4
     / 2 - 8
   1
     \ 3 - 5

  reduce(| leafs + sum |):
  (4)
  (8)
  [(4),(8)] + (2)

  (5)
  [(5)] + (3)

  [ [(4),(8)] + (2), [(5)] + (3) ] + (1)
*/

  'multiply-sum example': function() {
    var Walker = new ShimUtil.Walk(
      {
        value: 1,
        children: [
          {value: 2, children: [ {value: 4}, {value: 8}]},
          {value: 3, children: [ {value: 3, children: { value: 5 }}]}
        ]
      });

    console.log(Walker.map(
                  function(item) {
                    console.log('1st:', item);
                    item.value = item.value * 2;
                    return item;
                 })
                 .map(
                  function(item) {
                    console.log('2nd:', item);
                    return item;
                 })
                 // one way to write this
                 .reduce(function reducer(item, applicator){
                    if(Array.isArray(item)) {
                      return item.reduce(function(prev, subitem) {
                        return prev + reducer(subitem, applicator);
                      }, 0);
                    }
                    item = applicator(item);
                    if(item.children) {
                      return item.value + reducer(item.children, applicator);
                    }
                    return item.value;
                 })
                 // another way to write this
                 /*
                 .reduce(function reducer(item, applicator){
                    if(item.children) {
                      if(Array.isArray(item.children)) {
                        return item.children.reduce(function(prev, child) {
                            return prev + reducer(child, applicator);
                          }, applicator(item).value);
                      }
                      return reducer(item.children, applicator) + applicator(item).value;
                    }
                    return applicator(item).value;
                 })
                */
                );

    // preorder traversal is quite annoying to write reducers for

    // postorder traversal - probably nicer, since you only need to handle:
    // function reducer(item, children)
    // - e.g. either the children is set => reduce it appropriately
    // - or it's not set => redurn atomic value

  },

  'can walk a tree': function() {

    var Walker = new ShimUtil.Walk(
//        $.tag('div', { class: 'tabs'}, '')
        [
          $.tag('h1', {}, $.tag('h2', {}, 'Foo')),
          new PlaceholderView('Placeholder'),
          new Outlet('table', {}, [
            $.tag('h3', {}, 'Foo2'),
            new PlaceholderView('Placeholder2'),
            new Outlet('table', {}, 'Outlet2'),
          ]),
        ]
      );


    console.log(Walker.map(
                  function handleRenderables(item) {
                    if(item.render) {
                      return item.render();
                    }
                    return item;
                 })
                 .map(
                  function handleRenderables(item) {
                    console.log(item);
                    return item;
                 })
                 .reduce(toHTML)
                );

  }
};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}

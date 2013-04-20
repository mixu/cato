var util = require('util'),
    assert = require('assert'),
    $ = require('../lib/shim.js'),
    ShimUtil = require('../lib/shim.util.js'),
    toHTML = require('htmlparser-to-html'),
    PlaceholderView = require('./lib/placeholder.js'),
    Outlet = require('vjs2').Outlet;


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

    var a = { i: 'a', value: 5 },
        b = { i: 'b', value: 3, children: a },
        c = { i: 'c', value: 3, children: [ b ] },
        d = { i: 'd', value: 4 },
        e = { i: 'e', value: 8 },
        f = { i: 'f', value: 2, children: [ d, e ]},
        root = { i: 'r', value: 1, children: [ f, c ] },
        mapTask = ShimUtil.chain([
          function(item, parent) {
            mapResults.push({ item: item, parent: parent });
            return item;
          }
        ]),
        mapResults = [];


   // one way to write this
   var result = (function reducer(item, parent, applicator){
          if(Array.isArray(item)) {
            return item.reduce(function(prev, subitem) {
              // parent, not item: the parent of an array item is not the array,
              // but rather the element that contained the array
              return prev + reducer(subitem, parent, applicator);
            }, 0);
          }
          item = applicator(item, parent);
          if(item.children) {
            return item.value + reducer(item.children, item, applicator);
          }
          return item.value;
       }(root, null, mapTask));
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
    // console.log(mapResults);

    assert.equal(mapResults[0].item, root);
    assert.equal(mapResults[0].parent, null);
    assert.equal(mapResults[1].item, f);
    assert.equal(mapResults[1].parent, root);
    assert.equal(mapResults[2].item, d);
    assert.equal(mapResults[2].parent, f);
    assert.equal(mapResults[3].item, e);
    assert.equal(mapResults[3].parent, f);
    assert.equal(mapResults[4].item, c);
    assert.equal(mapResults[4].parent, root);
    assert.equal(mapResults[5].item, b);
    assert.equal(mapResults[5].parent, c);
    assert.equal(mapResults[6].item, a);
    assert.equal(mapResults[6].parent, b);


  },
/*
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
*/
};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}

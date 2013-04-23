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

    var itemPath = mapResults.map(function(item) { return item.item.i; }).join(','),
        parentPath = mapResults.map(function(item) { return (item.parent ? item.parent.i : '!'); }).join(',');

    console.log('items:', itemPath);
    console.log('parents:', parentPath);

    assert.equal(itemPath,   'r,f,d,e,c,b,a');
    assert.equal(parentPath, '!,r,f,f,r,c,b');
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

  'dfsTraverse can traverse a tree of tags, with parentTag': function() {
    var a = { id: 'a' },
        b = { id: 'b', children: a },
        c = { id: 'c', children: [ b ] },
        d = { id: 'd' },
        e = { id: 'e' },
        f = { id: 'f', children: [ d, e ]},
        root = { id: 'r', children: [ f, c ] },
        mapResults = [];

    ShimUtil.dfsTraverse(root, function(item, parentTag) {
      mapResults.push({ item: item, parentTag: parentTag });
      return item;
    });

    var itemPath = mapResults.map(function(item) { return item.item.id; }).join(','),
        parentPath = mapResults.map(function(item) { return (item.parentTag ? item.parentTag.id : '!'); }).join(',');

    console.log('items:', itemPath);
    console.log('parents:', parentPath);

    assert.equal(itemPath,   'r,f,d,e,c,b,a');
    assert.equal(parentPath, '!,r,f,f,r,c,b');
  },

/*
  <h1 id="a">
    <h2 id="b">Foo</h2>
  </h1>
  <p id="1">Placeholder</p>
  <table id="c">Outlet</table>
    <h2 id="d">Foo2</h2>
    <p id="2">Placeholder2</p>
    <table id="e"><h3 id="f">Last</h3></table>
  </h3>
*/

  'dfsTraverse can traverse a tree of tags and views, with parentTag and parentView': function() {
    var root = [
          $.tag('h1', { id: 'a' }, // no parent tag, no parent view
            $.tag('h2', { id: 'b' }, 'Foo') // parent tag is a, no parent view
          ),
          new PlaceholderView('Placeholder'), // no parent tag, no parent view
          new Outlet('table', { id: 'c' }, [ // no parent tag, no parent view
            $.tag('h3', { id: 'd' }, 'Foo2'), // parent tag is c, parent view is c
            new PlaceholderView('Placeholder2'), // parent tag is c, parentview is c
            new Outlet('table', { id: 'e' }, // parent tag is c, parent view is c
              $.tag('h3', { id: 'f' }, 'Last') // parent tag is e, parent view is e
              ),
          ]),
        ],
        mapResults = [];

    ShimUtil.dfsTraverse(root, function(item, parentTag, parentView) {
      if(!item.render) {
        console.log('item:',
            (item && item.attribs && item.attribs.id ? item.attribs.id : JSON.stringify(item)),
            (parentTag && parentTag.attribs && parentTag.attribs.id ? parentTag.attribs.id : JSON.stringify(parentView)),
            (parentView && parentView.id ? parentView.id : JSON.stringify(parentView))
            );
        mapResults.push({ item: item, parentTag: parentTag, parentView: parentView });
      }
      return item;
    });

    var itemPath = mapResults.map(function(item) {
          return (item.item && item.item.attribs && item.item.attribs.id ? item.item.attribs.id : '?');
        }).join(','),
        parentPath = mapResults.map(function(item) {
          return (item.parentTag && item.parentTag.attribs && item.parentTag.attribs.id ? item.parentTag.attribs.id : '!');
        }).join(','),
        parentViewPath = mapResults.map(function(item) {
          return (item.parentView && item.parentView.id ? item.parentView.id : '!');
        }).join(',');


    console.log('items:   ', itemPath);
    console.log('parTags: ', parentPath);
    console.log('parViews:', parentViewPath);

    assert.equal(itemPath,   'a,b,1,c,d,2,e,f');
    assert.equal(parentPath, '!,a,!,!,c,c,c,e');

  }

};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}

var assert = require('assert'),

    PlaceholderView = require('./lib/placeholder.js'),
    Outlet = require('vjs2').Outlet,
    $ = require('vjs2').Shim;
//    htmlparser = require('htmlparser');

if(typeof exports == 'undefined') { exports = {}; }
if(typeof module == 'undefined') { module = { exports: exports }; }

function parse(html, cb) {
  cb();
  return html;

  var handler = new htmlparser.DefaultHandler(function(error, dom) {
      if(error) throw error;
      cb(dom);
    }, { verbose: false, ignoreWhitespace: true });
  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(html);
}

exports['unified rendering -'] = {

  'simple': {
    beforeEach: function() {
      $._reset();
    },

    /*
      Basic rendering, just text as content
    */

    'render a html string': function(done) {
      var result = $.html('<h1 id="1">String</h1>');
      parse(result, function(dom) {
        assert.equal( result, '<h1 id="1">String</h1>');
        dom && assert.deepEqual(dom, [ { type: 'tag', name: 'h1', attribs: { id: 1 }, children: [ { data: 'String', type: 'text' } ] } ]);
        done();
      });
    },

    'render single tag': function(done) {
      var result = $.html($.tag('h1', { id: 1 }, 'foo'));
      parse(result, function(dom) {
        assert.equal( result, '<h1 id="1">foo</h1>');
        dom && assert.deepEqual(dom, [ { type: 'tag', name: 'h1', attribs: { id: 1 }, children: [ { data: 'foo', type: 'text' } ] } ]);
        done();
      });
    },

    'render single view': function(done) {
      var result = $.html(new PlaceholderView('Hello'));
      parse(result, function(dom) {
        assert.ok(new RegExp('<p id="[^"]+">Hello</p>').test(result));
        dom && assert.deepEqual(dom,
          [ { type: 'tag',
              name: 'p',
              attribs: { id: '1' },
              children: [ { data: 'Hello', type: 'text' } ] } ]);
        done();
      });
    },

    'render single outlet': function(done) {
      var result = $.html(new Outlet('span', {}, 'Foo'));
      parse(result, function(dom) {
        assert.ok(new RegExp('<span id="[^"]+">Foo</span>').test(result));
        dom && assert.deepEqual(dom, [
          { type: 'tag', name: 'span', attribs: { id: 1 }, children: [
            { data: 'Foo', type: 'text' }
          ]}]);
        done();
      });
    },

  },

  'container': {
    beforeEach: function() {
      $._reset();
    },

  /*
               --- Container ---
     Input  | tag | outlet
    --------|-------------------------------
     string | -1.    0.
        tag |  1.    2.
       view |  3.    4.
     outlet |  5.    6.
     array  |  7.    8.

    Note: the array contains a tag, a view, an outlet
          and an array of another tag, view and outlet

    Views cannot contain anything - there is no standard API for a view to contain another item.
    Internally, views may contain tags and outlets (which in turn may contain/manage any other renderables).
  */

    'render string inside tag': function(done) {
      var result = $.html($.tag('h1', {}, '<h2>String</h2>'));
      parse(result, function(dom) {
        assert.equal(result, '<h1><h2>String</h2></h1>');
        dom && assert.deepEqual(dom,
          [ { type: 'tag',
              name: 'h1',
              children:
               [ { type: 'tag',
                   name: 'h2',
                   children: [ { data: 'String', type: 'text' } ] } ] } ]);
        done();
      });
    },

    'render string inside outlet': function(done) {
      var result = $.html(new Outlet('table', {}, '<h2>String</h2>'));
      parse(result, function(dom) {
        assert.ok(new RegExp('<table id="[^"]+"><h2>String</h2></table>').test(result));
        dom && assert.deepEqual(dom,
          [ { type: 'tag',
              name: 'table',
              attribs: { id: 1 },
              children:
               [ { type: 'tag',
                   name: 'h2',
                   children: [ { data: 'String', type: 'text' } ] } ] } ]);
        done();
      });
    },

    'render tag inside tag': function(done) {
      var result = $.html($.tag('h1', {}, $.tag('h2', {}, 'Foo')));
      parse(result, function(dom) {
        assert.equal(result, '<h1><h2>Foo</h2></h1>');
        dom && assert.deepEqual(dom,
          [ { type: 'tag',
              name: 'h1',
              children:
               [ { type: 'tag',
                   name: 'h2',
                   children: [ { data: 'Foo', type: 'text' } ] } ] } ]);
        done();
      });
    },

    'render tag inside outlet': function(done) {
      var result = $.html(new Outlet('table', {}, $.tag('h2', {}, 'Foo')));
      parse(result, function(dom) {
        assert.ok(new RegExp('<table id="[^"]+"><h2>Foo</h2></table>').test(result));
        dom && assert.deepEqual(dom,
          [ { type: 'tag',
              name: 'table',
              attribs: { id: 1 },
              children:
               [ { type: 'tag',
                   name: 'h2',
                   children: [ { data: 'Foo', type: 'text' } ] } ] } ]);
        done();
      });
    },

    'render view inside tag': function(done) {
      var result = $.html($.tag('h1', {}, new PlaceholderView('Hello')));
      parse(result, function(dom) {
        assert.ok(new RegExp('<h1><p id="[^"]+">Hello</p></h1>').test(result));
        dom && assert.deepEqual(dom,
          [ { type: 'tag',
              name: 'h1',
              children:
               [ { type: 'tag',
                   name: 'p',
                   attribs: { id: 1 },
                   children: [ { data: 'Hello', type: 'text' } ] } ] } ]);
        done();
      });
    },

    'render view inside outlet': function(done) {
      var result = $.html(new Outlet('table', {}, new PlaceholderView('Hello')));
      parse(result, function(dom) {
        assert.ok(new RegExp('<table id="[^"]+"><p id="[^"]+">Hello</p></table>').test(result));
        dom && assert.deepEqual(dom,
          [ { type: 'tag',
              name: 'table',
              attribs: { id: 1 },
              children:
               [ { type: 'tag',
                   name: 'p',
                   attribs: { id: 2 },
                   children: [ { data: 'Hello', type: 'text' } ] } ] } ]);
        done();
      });
    },

    'render outlet inside tag': function(done) {
      var result = $.html($.tag('h1', {}, new Outlet('table', {}, 'Foo')));
      parse(result, function(dom) {
        assert.ok(new RegExp('<h1><table id="[^"]+">Foo</table></h1>').test(result));
        dom && assert.deepEqual(dom,
          [ { type: 'tag',
              name: 'h1',
              children:
               [ { type: 'tag',
                   name: 'table',
                   attribs: { id: 1 },
                   children: [ { data: 'Foo', type: 'text' } ] } ] } ]);
        done();
      });
    },

    'render outlet inside outlet': function(done) {
      var result = $.html(new Outlet('table', {}, new Outlet('table', {}, 'Foo')));
      parse(result, function(dom) {
        assert.ok(new RegExp('<table id="[^"]+"><table id="[^"]+">Foo</table></table>').test(result));
        dom && assert.deepEqual(dom,
          [ { type: 'tag',
              name: 'table',
              attribs: { id: 2 },
              children:
               [ { type: 'tag',
                   name: 'table',
                   attribs: { id: 1 },
                   children: [ { data: 'Foo', type: 'text' } ] } ] } ]);
        done();
      });
    },

  },

  /*
      Note: the array contains a tag, a view, an outlet
          and an array of another tag, view and outlet
   */

  'arrays': {

    beforeEach: function() {
      $._reset();
      this.arr = [
          $.tag('h1', {}, 'Foo'),
          new PlaceholderView('Placeholder'),
          new Outlet('table', {}, 'Outlet'),
          [
            $.tag('h2', {}, 'Foo2'),
            new PlaceholderView('Placeholder2'),
            new Outlet('table', {}, 'Outlet2'),
          ]
        ];
    },

    'render array inside tag': function(done) {
      var result = $.html($.tag('h3', {}, this.arr));
      parse(result, function(dom) {
        assert.ok(new RegExp('<h3>'+
          '<h1>Foo</h1><p id="[^"]+">Placeholder</p><table id="[^"]+">Outlet</table>'+
          '<h2>Foo2</h2><p id="[^"]+">Placeholder2</p><table id="[^"]+">Outlet2</table></h3>').test(result));
        dom && assert.deepEqual(dom,
          [ { type: 'tag',
              name: 'h3',
              children:
               [ { type: 'tag',
                   name: 'h1',
                   children: [ { data: 'Foo', type: 'text' } ] },
                 { type: 'tag',
                   name: 'p',
                   attribs: { id: 3 },
                   children: [ { data: 'Placeholder', type: 'text' } ] },
                 { type: 'tag',
                   name: 'table',
                   attribs: { id: 1 },
                   children: [ { data: 'Outlet', type: 'text' } ] },
                { type: 'tag',
                   name: 'h2',
                   children: [ { data: 'Foo2', type: 'text' } ] },
                 { type: 'tag',
                   name: 'p',
                   attribs: { id: 4 },
                   children: [ { data: 'Placeholder2', type: 'text' } ] },
                 { type: 'tag',
                   name: 'table',
                   attribs: { id: 2 },
                   children: [ { data: 'Outlet2', type: 'text' } ] },
                    ] } ]);
        done();
      });
    },

    'render array inside outlet': function(done) {
      var result = $.html(new Outlet('table', {}, this.arr));
      parse(result, function(dom) {
        assert.ok(new RegExp('<table id="[^"]+">'+
          '<h1>Foo</h1><p id="[^"]+">Placeholder</p><table id="[^"]+">Outlet</table>'+
          '<h2>Foo2</h2><p id="[^"]+">Placeholder2</p><table id="[^"]+">Outlet2</table></table>').test(result));
        dom && assert.deepEqual(dom,
          [ { type: 'tag',
              name: 'table',
              attribs: { id: 3 },
              children:
               [ { type: 'tag',
                   name: 'h1',
                   children: [ { data: 'Foo', type: 'text' } ] },
                 { type: 'tag',
                   name: 'p',
                   attribs: { id: 4 },
                   children: [ { data: 'Placeholder', type: 'text' } ] },
                 { type: 'tag',
                   name: 'table',
                   attribs: { id: 1 },
                   children: [ { data: 'Outlet', type: 'text' } ] },
                { type: 'tag',
                   name: 'h2',
                   children: [ { data: 'Foo2', type: 'text' } ] },
                 { type: 'tag',
                   name: 'p',
                   attribs: { id: 5 },
                   children: [ { data: 'Placeholder2', type: 'text' } ] },
                 { type: 'tag',
                   name: 'table',
                   attribs: { id: 2 },
                   children: [ { data: 'Outlet2', type: 'text' } ] },
                    ] } ]);
        done();
      });
    }
  }
};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}

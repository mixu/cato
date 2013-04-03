var fs = require('fs'),
    url = require('url'),
    Glue = require('gluejs');

var contentTypes = {
  '.html': 'text/html',
  '.css': 'text/css'
};


function Router() {
  this.routes = [];
}

Router.prototype.add = function(expr, path) {
  this.routes.push({ route: expr, path: path });
};

Router.prototype.modelPath = function(value) {
  this._modelPath = value;
};

Router.prototype.findFile = function(path) {

};

Router.prototype.route = function(req, res) {
  var pathname = url.parse(req.url).pathname;

  // is it asset route?
  if(/^\/static\//.test(pathname)) {
    // 1. assets: /assets/*
    var absPath = this.findFile(pathname);

    if(!absPath) {
      return false;
    }

    if(contentTypes[path.extname(absPath)]) {
      res.setHeader('content-type', contentTypes[path.extname(absPath)]);
    }
    res.end(fs.readFileSync(absPath));
    return true;
  } else if(/^\/package\//.test(pathname)) {
    res.setHeader('content-type', 'application/javascript');
    if(pathname == '/package/vjs.js') {
      res.end(fs.readFileSync(__dirname + '/../dist/vjs.js'));
    } else if(pathname == '/package/core/models.js') {
      if(!this._modelPath) {
        throw new Error('Must call .modelPath()');
      }
      // take the models directory and package it up
      new Glue()
        .basepath(this._modelPath)
        .include(this._modelPath)
        .replace({
          'microee': 'window.Vjs2.Microee',
          'jQuery': 'window.jQuery'
        })
        .define('index.js', 'module.exports = { Project: require(\'./project.js\') };')
        .export('Model')
        .render(function (err, txt) {
          res.end(txt);
        });
    } else {
      // generate package for this section of the app

      // hardcoded for now
      new Glue()
        .basepath(this.routes[0].path)
        .include(this.routes[0].path)
        .replace({
          'vjs2': 'window.Vjs2',
          'microee': 'window.Vjs2.Microee',
          'jQuery': 'window.jQuery'
        })
        .export('TableModule')
        .render(function (err, txt) {
          res.end(txt);
        });



      return true;
    }
    return true;
  } else {
    // find the module that corresponds to the current pathname
    return this.routes.some(function(route) {
      if (route.route == pathname || route.route.test && route.route.test(pathname)) {
        var pkg = 'TableModule';
        // generate the base page (minimal wrapper, base CSS, framework core)
        var page = ['<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">',
//                    '<link rel="stylesheet" href="/static/style.css">',
                    '<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>',
                    // (core) View layer / model layer library dist
                    '<script src="/package/vjs.js"></script>',
                    // (core) Model definitions
                    '<script src="/package/core/models.js"></script>',
                    // (app) Hot / cold model cache
                    '<script></script>',
                    // (app) Section package
                    '<script src="/package/'+pkg+'.js"></script>',
                    // (state) Section state + DOM primer + init call
                    '<script>'+pkg+'.init("'+pathname+'");</script>',
                    // final bit of HTML
                    '</head><body></body></html>'
                    ].join('');

          res.setHeader('content-type', contentTypes['.html']);
          res.end(page);
        return true;
      }
    });
  }
};

module.exports = new Router();

var url = require('url');

var contentTypes = {
  '.html': 'text/html',
  '.css': 'text/css'
};


function Router() {
  this.routes = [];
}

Router.prototype.add = function(expr, module) {
  this.routes.push({ route: expr, module: module });
};

Router.prototype.findFile = function(path) {

};

Router.prototype.route = function(req, res) {
  var pathname = url.parse(req.url).pathname;

  // is it asset route?
  if(/^static\//.test(pathname)) {
    // 1. assets: /assets/*
    var absPath = this.findFile(pathname);

    if(!absPath) {
      return false;
    }

    if(contentTypes[path.extname(absPath)]) {
      res.setHeader('content-type', contentTypes[path.extname(absPath)]);
    }
    res.end(fs.readFileSync(absPath));

  } else if(/^package\//.test(pathname)) {
    if(pathname == 'package/vjs.js') {

    }
    new Glue()
      .basepath(__dirname + '/models')
      .include(__dirname + '/models')
      .define('index.js', 'module.exports = { Todos: require("todos.js") };')
      .export('Models')
      .render(function (err, txt) {
        res.setHeader('content-type', 'application/javascript');
        res.end(txt);
      });
  } else {
    // find the module that corresponds to the current pathname
    return this.routes.some(function(route) {
      if (route.route.test(pathname)) {
        // generate the base page (minimal wrapper, base CSS, framework core)
        var page = ['<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">',
                    '<link rel="stylesheet" href="assets/style.css">',
                    '<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js"></script>',
                    // (core) View layer library dist
                    '<script src="/package/vjs.js"></script>',
                    // (core) Model layer library dist
                    '<script src="/package/model.lib.js"></script>',
                    // (core) Model definitions
                    '<script src="/package/core/models.js"></script>',
                    // (app) Hot / cold model cache
                    '<script></script>',
                    // (app) Section package
                    '<script src="/package/'+pkg+'.js"></script>',
                    // (state) Section state + DOM primer + init call
                    '<script>'+pkg+'("'+pathname+'");</script>',
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

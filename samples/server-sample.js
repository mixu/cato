var fs = require('fs'),
    url = require('url'),
    http = require('http');

function getModule(pathname) {

}

// Cases:
// 1. assets: /assets/*
// 2. API: /api/*
// 3. app sections: (remainder)

// find the module that corresponds to the current pathname

// generate the base page (minimal wrapper, base CSS, framework core)

// add a link to the module - via the packager API

// possibilities:
// 1. cold cache, cold DOM
// 2. hot cache, cold DOM
// 3. hot cache, hot DOM


var server = http.createServer(function(req, res) {
  var pathname = url.parse(req.url).pathname;

  switch(pathname) {
    case '/':
      res.setHeader('content-type', 'text/html');
      res.end(fs.readFileSync('./public/index.html'));
      break;
    case '/css/style.css':
      res.setHeader('content-type', 'text/css');
      res.end(fs.readFileSync('./public/css/style.css'));
      break;
    default:
      console.log('404', req.url);
      res.statusCode = 404;
      res.end();
  }
});

server.listen(8000);

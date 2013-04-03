var fs = require('fs'),
    url = require('url'),
    http = require('http');

var vjsServer = require('../lib/server.js');

vjsServer.add('/', require('./table'));

var server = http.createServer(function(req, res) {
  var pathname = url.parse(req.url).pathname;
  if(/^api\//.test(pathname)) {
    // 1. API: /api/*
  } else {
    // 2. module page / module dynamic package / module static asset
    if(!vjsServer.route(req, res)) {
      console.log('404', req.url);
      res.statusCode = 404;
      res.end();
    }
  }
});

server.listen(8000);

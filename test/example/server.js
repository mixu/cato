var http = require('http'),
    fs = require('fs'),
    url = require('url');

http.createServer(function(req, res) {
  var parsed = url.parse(req.url, true);

  switch(parsed.path) {
    case '/':
      res.setHeader('Content-type', 'text/html');
      fs.createReadStream('./index.html').pipe(res);
      break;
    case '/view.js':
      res.setHeader('Content-type', 'text/javascript');
      res.end();
      break;
    case '/cato.js':
      res.setHeader('Content-type', 'text/javascript');
      fs.createReadStream('../../dist/cato.js').pipe(res);
      break;
    default:
      res.end();
      break;
  }

}).listen(9000);

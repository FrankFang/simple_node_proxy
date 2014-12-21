// Generated by CoffeeScript 1.8.0
(function() {
  var PORT, fs, http, path, regExpEscape, url;

  http = require('http');

  url = require('url');

  fs = require('fs');

  path = require('path');

  PORT = 3333;

  console.log('http proxy start at post ' + PORT);

  regExpEscape = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  http.globalAgent.maxSockets = 16;

  http.createServer(function(req, res) {
    var clientRequest, dest, ext, map, option, pattern, regex, resolvedPath, result, rulers, target, _host, _ref, _url;
    target = req.url;
    rulers = JSON.parse(fs.readFileSync('./myproxy.rulers.json', 'utf8'));
    for (pattern in rulers) {
      dest = rulers[pattern];
      regex = new RegExp(regExpEscape(pattern));
      if (regex.test(target)) {
        console.log('Redirect: ' + target + ' to: ' + dest);
        if (path.isAbsolute(dest)) {
          resolvedPath = dest;
        } else {
          resolvedPath = path.join(__dirname, dest);
        }
        result = fs.readFileSync(resolvedPath, null);
        ext = path.extname(resolvedPath);
        map = {
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.xml': 'application/xml'
        };
        res.writeHead(200, {
          'content-type': map[ext] || 'text/html'
        });
        res.write(result);
        res.end();
        return;
      }
    }
    res._end = res.end;
    res.end = function(data) {
      return res._end(data);
    };
    _url = url.parse(req.url);
    _host = req.headers.host.split(':');
    option = {
      host: _host[0],
      port: Number((_ref = _host[1]) != null ? _ref : '80'),
      path: _url.pathname + (_url.search || ''),
      method: req.method,
      headers: req.headers
    };
    clientRequest = http.request(option);
    req.on('data', function(chunk) {
      return clientRequest.write(chunk);
    });
    req.on('end', function() {
      return clientRequest.end();
    });
    clientRequest.on('response', function(response) {
      var hs;
      hs = response.headers;
      res.writeHead(response.statusCode, hs);
      response.on('data', function(chunk) {
        return res.write(chunk);
      });
      return response.on('end', function() {
        return res.end();
      });
    });
    return clientRequest.on('error', function(error) {
      console.log(error);
      return res.end();
    });
  }).listen(PORT);

}).call(this);

//# sourceMappingURL=myproxy.js.map

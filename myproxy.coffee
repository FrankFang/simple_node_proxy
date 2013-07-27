http = require 'http'
url = require 'url'
fs = require 'fs'
PORT = 3333

console.log 'http proxy start at post ' + PORT

http.globalAgent.maxSockets = 16;

http.createServer (req, res) ->
  pathName = url.parse(req.url).pathname
  rulers = JSON.parse(fs.readFileSync('./myproxy.rulers.json', 'utf8'))
  for src, dest of rulers
    if pathName.indexOf(src) > 0
      result = fs.readFileSync(dest, 'utf8')
      res.writeHead(200, {'content-type': 'text/script'})
      res.write(result)
      res.end()
      return

  # replace here

  res._end = res.end
  res.end = (data) ->
    res._end(data)
    console.log req.method, res.statusCode, req.url
  _url = url.parse(req.url)
  _host = req.headers.host.split(':')

  req.on 'end', ()->
    console.log('end')

  option =
    host: _host[0]
    port: Number(_host[1] ? '80')
    path: _url.pathname + (_url.search or '')
    methed: req.method
    headers: req.headers

  clientRequest = http.request(option)
  req.on 'data', (chunk)->
    clientRequest.write(chunk)

  req.on 'end', ()->
    clientRequest.end()

  clientRequest.on 'response', (response)->
    hs = response.headers
    res.writeHead(response.statusCode, hs)
    response.on 'data', (chunk)->
      res.write(chunk)
    response.on 'end', ()->
      res.end()

  clientRequest.on 'error', (error)->
    console.log(error)
    res.end()

.listen(PORT)

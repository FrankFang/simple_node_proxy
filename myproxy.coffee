http = require 'http'
url = require 'url'
fs = require 'fs'
path = require 'path'
PORT = 3333

console.log 'http proxy start at post ' + PORT

regExpEscape = (s) ->
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

http.globalAgent.maxSockets = 16

http.createServer (req, res) ->

    target = req.url
    rulers = JSON.parse(fs.readFileSync('./myproxy.rulers.json', 'utf8'))

    for pattern, dest of rulers
        hold = false

        regex = new RegExp(regExpEscape(pattern))

        if target.indexOf('jquery-latest.js') >= 0
            hold = true

        if regex.test(target)

            console.log 'Redirect: ' + target + ' to: ' + dest

            resolvedPath = dest
            result = fs.readFileSync resolvedPath, null
            ext = path.extname(resolvedPath)
            map = {
                '.js': 'application/javascript'
                '.css': 'text/css',
                '.xml': 'application/xml'
            }
            if hold
                f = ()->
                    console.log 'here'
                    res.writeHead(200, {
                        'content-type': map[ext] || 'text/html'
                    #'last-modified': 'Tue, 15 Jul 2100 08:08:11 GMT'
                    })
                    res.write(result)
                    res.end()

                setTimeout(f , 10000)
            else
                res.writeHead(200, {
                    'content-type': map[ext] || 'text/html'
                #'last-modified': 'Tue, 15 Jul 2100 08:08:11 GMT'
                })
                res.write(result)
                res.end()
            return


    _url = url.parse(req.url)
    _host = req.headers.host.split(':')



    option =
        host: _host[0]
        port: Number(_host[1] ? '80')
        path: _url.pathname + (_url.search or '')
        method: req.method
        headers: req.headers

    if option.host is 'channel.crm.1688.com'
        option.port = 5100
    else if option.host is 'assets.1688.com'
        option.port = 2333

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
        console.log error
        res.end()

.listen(PORT)

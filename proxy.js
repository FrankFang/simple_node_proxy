/*jshint node:true*/

var http = require('http')
var url = require('url')
var fs = require('fs')
var path = require('path')

var PORT = 3333

function getConfigFolder() {
    if (process.platform === 'win32') {
        return path.join(process.env['USERPROFILE'], '_snp')
    } else {
        return path.join(process.env['HOME'], '.snp')
    }
}
function regExpEscape(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}


http.globalAgent.maxSockets = 16

var proxy = http.createServer(function (req, res) {
    var target = req.url
    var rulers, mime;
    try {
        rulers = JSON.parse(fs.readFileSync(path.join(getConfigFolder(), 'config.json'), 'utf8'));
    } catch (exception) {
        console.log(exception)
    }
    try {
        mime = JSON.parse(fs.readFileSync(path.join(getConfigFolder(), 'mime.json'), 'utf8'))
    } catch (exception) {
        console.log(exception)
    }

    var dest
    var regex
    var resolvedPath
    for (var pattern in rulers) {
        dest = rulers[pattern]
        regex = new RegExp(regExpEscape(pattern))

        if (regex.text(target)) {
            console.log('redirect ' + target + 'to ' + dest)
        }
        if (path.isAbsolute(dest)) {
            resolvedPath = dest
        } else {
            resolvedPath = path.join(__dirname, dest)
        }

        var file = fs.readFileSync(resolvedPath, null)
        var extension = path.extname(resolvedPath)

        res.writeHead(200, {
            'content-type': mime[extension] || 'text/html'
        })
        res.write(file)
        res.end()
        return
    }

    var _url = url.parse(req.url)
    var _host = req.headers.host.split(':')
    var option = {
        host: _host[0],
        port: (_host[1] || 80) - 0,
        path: _url.pathname + (_url.search || ''),
        method: req.method,
        headers: req.headers
    }

    var clientRequest = http.request(option)

    req.on('data', function (chunk) {
        clientRequest.write(chunk)
    })

    req.on('end', function () {
        clientRequest.end()
    })

    clientRequest.on('response', function (clientRes) {
        res.writeHead(clientRes.statusCode, clientRes.headers)
        clientRes.on('data', function (chunk) {
            res.write(chunk)
        })
        clientRes.on('end', function () {
            res.end()
        })
    })
    clientRequest.on('error', function (error) {
        console.log(error)
        res.end()
    })

})

proxy.listen(PORT)
console.log('http proxy starts to listen to ' + PORT)

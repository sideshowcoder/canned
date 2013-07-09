var url = require('url')
var fs = require('fs')
var util = require('util')
var Response = require('./lib/response')

function Canned(dir, options) {
  this.logger = options.logger
  this.response_opts = { cors_enabled: options.cors }
  this.dir = process.cwd() + '/' + dir
}

function scanFileListForName(files, pattern) {
  if(!files) return false // guard against no files found

  var m, i, e
  for (i = 0, e = files[i]; e != null; e = files[++i]) {
    m = e.match(new RegExp(pattern))
    if(m) return m
  }
  return false
}

function removeJSLikeComments(text) {
  return text.replace(/\/\*.+?\*\/|\/\/.*(?=[\n\r])/g, '')
}

Canned.prototype._extractOptions = function(data) {
  var lines = data.split('\n')
  var opts = {}
  if (lines[0].indexOf('//!') !== -1) {
    try {
      var content = lines[0].replace('//!','')
      content = content.split(',').map(function(s) {
        return '"' + s.split(':')[0].trim() + '":' + s.split(':')[1]
      }).join(',')
      opts = JSON.parse('{' + content  + '}')
    } catch(e) {
      this._log('Invalid file header format try //! statusCode: 201')
      opts = {}
    }
    lines.splice(0,1)
  }
  var statusCode = opts.statusCode || 200
  return { statusCode: statusCode, data: lines.join('\n') }
}

function sanatize(data, cType) {
  var sanatized
  switch (cType) {
    case 'json':
      // make sure we return valid JSON even so we support comments
      try {
        sanatized = JSON.stringify(JSON.parse(removeJSLikeComments(data)))
      } catch(err) {
        return false
      }
      break
    default:
      sanatized = data
  }
  return sanatized
}

Canned.prototype._headers = function(type) {
  return new Response(type, { cors_enabled: this.cors }).headers()
}

// return a data structure representing the response for a file
// datastructure mirrors Racks [headers, status, content]
// while headers are [[name, value], [name, value]]
Canned.prototype._responseForFile = function(fname, path, method, files, cb) {
  var pattern = fname + '\.' + method + '\.(.+)'
  var that = this
  var m

  if(m = scanFileListForName(files, pattern)) {
    var file = path + '/' + m[0]
    fs.readFile(file, { encoding: 'utf8' }, function(err, data) {
      if (err) {
        var response = new Response('html', that.response_opts)
        cb('Not found', [response.headers(), 404, ''])
      } else {
        var response = new Response(m[1], that.response_opts)
        var _data = that._extractOptions(data)
        data = _data.data
        var statusCode = _data.statusCode
        var content = sanatize(data, response.content_type)
        if (content) {
          cb(null, [response.headers(), statusCode, content])
        } else {
          var response = new Response('html', that.response_opts)
          cb(null, [response.headers(), 500, 'Internal Server error invalid input file'])
        }
      }
    })
  } else {
    var response = new Response('html', that.response_opts)
    cb('Not found', [response.headers(), 404, ''])
  }
}

function writeError(res) {
  writeResponse(res, [[['Content-Type', 'text/html']], 500, ''])
}

function writeResponse(res, resp) {
  for (var i = 0, h = resp[0][i]; h != null; h = resp[0][++i]) {
    res.setHeader(h[0], h[1])
  }
  res.statusCode = resp[1]
  res.end(resp[2])
}

Canned.prototype._log = function(message) {
  if (this.logger) this.logger.write(message)
}

Canned.prototype.responder = function(req, res) {
  var pathname = url.parse(req.url).pathname.split('/')
  var dname = pathname.pop()
  var fname = '_' + dname
  var method = req.method.toLowerCase()
  var path = this.dir + pathname.join('/')
  var that = this

  this._log('request: ' + req.method + ' ' + req.url)

  if (method == 'options') {
    that._log('Options request, serving CORS Headers\n')
    var response = new Response(null, this.response_opts)
    writeResponse(res, [response.headers(), 200, ''])
    return
  }

  fs.readdir(path, function(err, files) {
    fs.stat(path + '/' + dname, function(err, stats) {
      if (err) {
        that._responseForFile(fname, path, method, files, function(err, resp) {
          if (err) {
            that._responseForFile('any', path, method, files, function(err, resp) {
              if (err) {
                that._log(' not found\n')
              } else {
                that._log(' served via: ' + pathname.join('/') + '/any.' + method + '\n')
              }
              writeResponse(res, resp)
            })
          } else {
            that._log(' served via: ' + pathname.join('/') + '/' + fname + '.' + method + '\n')
            writeResponse(res, resp)
          }
        })
      } else {
        if(stats.isDirectory()) {
          var fpath = path + '/' + dname
          fs.readdir(fpath, function(err, files) {
            that._responseForFile('index', fpath, method, files, function(err, resp) {
              if (err) {
                that._log(' not found\n')
              } else {
                that._log(' served via: ' + pathname.concat(dname).join('/') + '/index.' + method + '\n')
              }
              writeResponse(res, resp)
            })
          })
        } else {
          writeError(res)
        }
      }
    })
  })
}

var canned = function(dir, options) {
  if (!options) options = {}
  c = new Canned(dir, options)
  return c.responder.bind(c)
}

module.exports = canned


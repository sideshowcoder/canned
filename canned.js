var url = require('url')
var fs = require('fs')
var util = require('util')
var Response = require('./lib/response')

function Canned(dir, options) {
  this.logger = options.logger
  this.response_opts = { 
    cors_enabled: options.cors,
    cors_headers: options.cors_headers
  }
  this.dir = process.cwd() + '/' + dir
}

function getFileFromRequest(files, fname, method, query) {
  
  if(!files) return false

  var m, i, e, matchString, matchPattern, fileMatch

  // if query params, match regexp based on filename to request
  if(query)
  {
    for (i = 0, e = files[i]; e != null; e = files[++i]) {
      fileMatch = e.match(/(.*)\?(.*)\.(.*)\.(.*)/)
      if(fileMatch)
      {
        matchString = fname + "?" + query + "." + method
        matchPattern = new RegExp(fileMatch[1] + "(?=.*" + fileMatch[2].split("&").join(")(?=.*") + ").+" + fileMatch[3])
        if(matchString.match(matchPattern))  return { filename: e, mimetype: fileMatch[4]}
      }
    }
  }

  // if match regexp based on request to filename
  for (i = 0, e = files[i]; e != null; e = files[++i]) {
    matchPattern = new RegExp(fname + '\.' + method + '\.(.+)')
    m = e.match(matchPattern)
    if(m) return { filename : m[0], mimetype : m[1] }
  }
  return false
}

function removeJSLikeComments(text) {
  return text.replace(/\/\*.+?\*\/|\/\/\s.*(?=[\n\r])/g, '')
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

Canned.prototype._responseForFile = function(fname, query, path, method, files, res, cb) {
  var that = this
  var fileObject = getFileFromRequest(files, fname, method, query)
  if(fileObject) {
    var filePath = path + '/' + fileObject.filename
    fs.readFile(filePath, { encoding: 'utf8' }, function(err, data) {
      if (err) {
        var response = new Response('html', '', 404, res, that.response_opts)
        cb('Not found', response)
      } else {
        var _data = that._extractOptions(data)
        data = _data.data
        var statusCode = _data.statusCode
        var content = sanatize(data, fileObject.mimetype)
        if (content) {
          var response = new Response(fileObject.mimetype, content, statusCode, res, that.response_opts)
          cb(null, response)
        } else {
          var content = 'Internal Server error invalid input file'
          var response = new Response('html', content, 500, res, that.response_opts)
          cb(null, response)
        }
      }
    })
  } else {
    var response = new Response('html', '', 404, res, that.response_opts)
    cb('Not found', response)
  }
}

Canned.prototype._log = function(message) {
  if (this.logger) this.logger.write(message)
}

Canned.prototype.responder = function(req, res) {
  var parsedurl = url.parse(req.url)
  var pathname = parsedurl.pathname.split('/')
  var query = parsedurl.query
  var dname = pathname.pop()
  var fname = '_' + dname
  var method = req.method.toLowerCase()
  var path = this.dir + pathname.join('/')
  var that = this

  this._log('request: ' + req.method + ' ' + req.url)

  if (method == 'options') {
    that._log('Options request, serving CORS Headers\n')
    new Response(null, '', 200, res,  this.response_opts).send()
    return
  }

  fs.readdir(path, function(err, files) {
    fs.stat(path + '/' + dname, function(err, stats) {
      if (err) {
        that._responseForFile(fname, query, path, method, files, res, function(err, resp) {
          if (err) {
            that._responseForFile('any', query, path, method, files, res, function(err, resp) {
              if (err) {
                that._log(' not found\n')
              } else {
                that._log(' served via: ' + pathname.join('/') + '/any.' + method + '\n')
              }
              resp.send()
            })
          } else {
            that._log(' served via: ' + pathname.join('/') + '/' + fname + '.' + method + '\n')
            resp.send()
          }
        })
      } else {
        if(stats.isDirectory()) {
          var fpath = path + '/' + dname
          fs.readdir(fpath, function(err, files) {
            that._responseForFile('index', query, fpath, method, files, res, function(err, resp) {
              if (err) {
                that._log(' not found\n')
              } else {
                that._log(' served via: ' + pathname.concat(dname).join('/') + '/index.' + method + '\n')
              }
              resp.send()
            })
          })
        } else {
          new Response('html', '', 500, res).send()
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


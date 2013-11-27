"use strict";

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

function matchFile(matchString, fname, method) {
  return matchString.match(
    new RegExp(fname + '\\.' + method + '\\.(.+)')
  )
}

function matchFileWithQuery(matchString) {
  return matchString.match(/(.*)\?(.*)\.(.*)\.(.*)/)
}

function matchFileWithExactQuery(matchString, fname, queryString, method) {
  return matchString.match(
    new RegExp(fname + "(?=.*" + queryString.split("&").join(")(?=.*") + ").+" + method)
  )
}

function removeJSLikeComments(text) {
  return text.replace(/\/\*.+?\*\/|\/\/\s.*(?=[\n\r])/g, '')
}

function getFileFromRequest(httpObj, files) {

  if (!files) return false

  var m, i, e, matchString, matchPattern, fileMatch

  // if query params, match regexp based on fname to request
  if(httpObj.query)
  {
    for (i = 0, e = files[i]; e != null; e = files[++i]) {
      fileMatch = matchFileWithQuery(e)
      if (fileMatch)
      {
        matchString = httpObj.fname + "?" + httpObj.query + "." + httpObj.method
        m = matchFileWithExactQuery(matchString, fileMatch[1], fileMatch[2], fileMatch[3])
        if (m) return { fname: e, mimetype: fileMatch[4]}
      }
    }
  }

  // if match regexp based on request to fname
  for (i = 0, e = files[i]; e != null; e = files[++i]) {
    m = matchFile(e, httpObj.fname, httpObj.method)
    if (m) return { fname : m[0], mimetype : m[1] }
  }
  return false
}

Canned.prototype._extractOptions = function (data) {
  var lines = data.split('\n')
  var opts = {}
  if (lines[0].indexOf('//!') !== -1) {
    try {
      var content = lines[0].replace('//!', '')
      content = content.split(',').map(function (s) {
        return '"' + s.split(':')[0].trim() + '":' + s.split(':')[1]
      }).join(',')
      opts = JSON.parse('{' + content  + '}')
    } catch (e) {
      this._log('Invalid file header format try //! statusCode: 201')
      opts = {}
    }
    lines.splice(0, 1)
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
    } catch (err) {
      return false
    }
    break
  default:
    sanatized = data
  }
  return sanatized
}

Canned.prototype._responseForFile = function (httpObj, files, cb) {
  var that = this
  var fileObject = getFileFromRequest(httpObj, files)
  if (fileObject) {
    var filePath = httpObj.path + '/' + fileObject.fname
    fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {
      var response
      if (err) {
        response = new Response('html', '', 404, httpObj.res, that.response_opts)
        cb('Not found', response)
      } else {
        var _data = that._extractOptions(data)
        data = _data.data
        var statusCode = _data.statusCode
        var content = sanatize(data, fileObject.mimetype)
        if (content) {
          response = new Response(fileObject.mimetype, content, statusCode, httpObj.res, that.response_opts)
          cb(null, response)
        } else {
          content = 'Internal Server error invalid input file'
          response = new Response('html', content, 500, httpObj.res, that.response_opts)
          cb(null, response)
        }
      }
    })
  } else {
    var response = new Response('html', '', 404, httpObj.res, that.response_opts)
    cb('Not found', response)
  }
}

Canned.prototype._log = function (message) {
  if (this.logger) this.logger.write(message)
}

Canned.prototype._logHTTPObject = function (httpObj) {
  this._log(' served via: ' + httpObj.pathname.join('/') + '/' + httpObj.fname + '.' + httpObj.method + '\n')
}

Canned.prototype.responder = function (req, res) {
  var that = this
  var parsedurl = url.parse(req.url)

  var httpObj = {}
  httpObj.pathname  = parsedurl.pathname.split('/')
  httpObj.dname     = httpObj.pathname.pop()
  httpObj.fname     = '_' + httpObj.dname
  httpObj.path      = this.dir + httpObj.pathname.join('/')
  httpObj.query     = parsedurl.query
  httpObj.method    = req.method.toLowerCase()
  httpObj.res       = res

  this._log('request: ' + httpObj.method + ' ' + req.url)

  if (httpObj.method === 'options') {
    that._log('Options request, serving CORS Headers\n')
    var response = new Response(null, '', 200, res,  this.response_opts)
    return response.send()
  }

  fs.readdir(httpObj.path, function (err, files) {
    fs.stat(httpObj.path + '/' + httpObj.dname, function (err, stats) {
      if (err) {
        that._responseForFile(httpObj, files, function (err, resp) {
          if (err) {
            httpObj.fname = 'any'
            that._responseForFile(httpObj, files, function (err, resp) {
              if (err) {
                that._log(' not found\n')
              } else {
                that._logHTTPObject(httpObj)
              }
              resp.send()
            })
          } else {
            that._logHTTPObject(httpObj)
            resp.send()
          }
        })
      } else {
        if (stats.isDirectory()) {
          var fpath = httpObj.path + '/' + httpObj.dname
          fs.readdir(fpath, function (err, files) {
            httpObj.fname = 'index'
            httpObj.path  = fpath
            that._responseForFile(httpObj, files, function (err, resp) {
              if (err) {
                that._log(' not found\n')
              } else {
                that._logHTTPObject(httpObj)
              }
              resp.send()
            })
          })
        } else {
          new Response('html', '', 500, httpObj.res).send()
        }
      }
    })
  })
}

var canned = function (dir, options) {
  if (!options) options = {}
  var c = new Canned(dir, options)
  return c.responder.bind(c)
}

module.exports = canned


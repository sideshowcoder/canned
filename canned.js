"use strict";

var url = require('url')
var fs = require('fs')
var util = require('util')
var Response = require('./lib/response')
var qs = require('querystring')

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
        if (m) return { fname: e, mimetype: fileMatch[4] }
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

function getContentType(mimetype){
  return Response.content_types[mimetype]
}

// replace any body comments in format //! [string]
function stripBodyComments(data) {
  return data && data.replace(/\/\/\! [\w]*: ([\w {}":,@./]*)/, '').trim()
}

function getSelectedResponse(responses, content, headers) {
  var selectedResponse = null

  // find request matches and assign to chosenResponse
  responses.forEach(function(response) {
    var regex = new RegExp(/\/\/\! [A-z]*: ([\w {}":,@.]*)/g)
    var request = JSON.parse(regex.exec(response)[1])
    var variation = content || headers

    for(var entry in request) {
      if(request[entry] === variation[entry])  {
        selectedResponse = stripBodyComments(response)
        break
      }
    }
  })

  return selectedResponse
}

// return multiple response bodies as array
Canned.prototype.getEachResponse = function(data) {
  return data.match(/(\/\/\! [\w]*:[\w\s"{}:]*)((?!\/\/\!)[\w\s{}":@.,_<>\[\]/])*/g) || []
}

Canned.prototype.getVariableResponse = function(data, content, headers) {

  // return sanatized data if no conditional body comments
  if(!data.match(/\/\/\! [\w]*: {.*}/)) {
    return JSON.stringify(stripBodyComments(data))
  }

  var responses = this.getEachResponse(data)
  var selectedResponse = getSelectedResponse(responses, content, headers)

  // return first entry if there is no request match
  if(selectedResponse === null) {
    return JSON.stringify(stripBodyComments(responses[0]))
  }

  return JSON.stringify(selectedResponse)
}

Canned.prototype._extractOptions = function (data, httpObj) {
  var lines = data.split('\n')
  var opts = {}
  if (lines[0].indexOf('//! status') !== -1) {
    try {
      var content = lines[0].replace('//!', '')
      content = content.split(',').map(function (s) {
        var parts = s.split(':');
        parts[0] = '"' + parts[0].trim() + '"'
        return parts.join(':')
      }).join(',')
      opts = JSON.parse('{' + content  + '}')
    } catch (e) {
      this._log('Invalid file header format try //! statusCode: 201')
      opts = {}
    }
    lines.splice(0, 1)
  }
  var defaultStatusCode
  if (lines.length === 0 || lines[0].length === 0) {
    defaultStatusCode = 204
  } else {
    defaultStatusCode = 200
  }

  opts.statusCode = opts.statusCode || defaultStatusCode

  opts.data = JSON.parse(this.getVariableResponse(data, httpObj.content, httpObj.headers));

  return opts
}

Canned.prototype.sanatizeContent = function (data, fileObject) {
  var sanatized;

  if (data.length === 0) {
    return data
  }

  switch (fileObject.mimetype) {
  case 'json':
    // make sure we return valid JSON even so we support comments
    try {
      sanatized = JSON.stringify(JSON.parse(removeJSLikeComments(data)))
    } catch (err) {
      this._log("problem sanatizing content for " + fileObject.fname + " " + err)
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
  httpObj.filename = fileObject.fname
  if (fileObject) {
    var filePath = httpObj.path + '/' + fileObject.fname
    fs.readFile(filePath, { encoding: 'utf8' }, function (err, data) {
      var response
      if (err) {
        response = new Response(getContentType('html'), '', 404, httpObj.res, that.response_opts)
        cb('Not found', response)
      } else {
        var _data = that._extractOptions(data, httpObj)
        data = _data.data
        var statusCode = _data.statusCode
        var content = that.sanatizeContent(data, fileObject)

        if (content !== false) {
          response = new Response(_data.contentType || getContentType(fileObject.mimetype), content, statusCode, httpObj.res, that.response_opts)
          cb(null, response)
        } else {
          content = 'Internal Server error invalid input file'
          response = new Response(getContentType('html'), content, 500, httpObj.res, that.response_opts)
          cb(null, response)
        }
      }
    })
  } else {
    var response = new Response(getContentType('html'), '', 404, httpObj.res, that.response_opts)
    cb('Not found', response)
  }
}

Canned.prototype._log = function (message) {
  if (this.logger) this.logger.write(message)
}

Canned.prototype._logHTTPObject = function (httpObj) {
  this._log(' served via: .' + httpObj.pathname.join('/') + '/' + httpObj.filename + '\n')
}

Canned.prototype.respondWithDir = function (httpObj) {
  var that = this;

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
}

Canned.prototype.respondWithAny = function (httpObj, files) {
  var that = this;

  httpObj.fname = 'any';
  that._responseForFile(httpObj, files, function (err, resp) {
    if (err) {
      that._log(' not found\n')
    } else {
      that._logHTTPObject(httpObj)
    }
    resp.send()
  })
}

Canned.prototype.responder = function(body, req, res) {
  var httpObj = {}
  var that = this
  var parsedurl = url.parse(req.url)

  httpObj.headers   = req.headers
  httpObj.content   = body
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
            that.respondWithAny(httpObj, files);
          } else {
            that._logHTTPObject(httpObj)
            resp.send()
          }
        })
      } else {
        if (stats.isDirectory()) {
          that.respondWithDir(httpObj);
        } else {
          new Response('html', '', 500, httpObj.res).send();
        }
      }
    })
  })
}

Canned.prototype.responseFilter = function (req, res) {
  var that = this
  var body = ''

  // assemble response body if POST/PUT
  if(req.method === 'PUT' || req.method === 'POST') {
    req.on('data', function (data) {
      body += data
    })
    req.on('end', function () {
      that.responder(qs.parse(body), req, res)
    })
  } else {
    that.responder(body, req, res)
  }
}

var canned = function (dir, options) {
  if (!options) options = {}
  var c = new Canned(dir, options)
  return c.responseFilter.bind(c)
}

module.exports = canned


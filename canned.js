"use strict";

var url = require('url')
var fs = require('fs')
var path = require('path')
var util = require('util')
var Response = require('./lib/response')
var querystring = require('querystring')
var url = require('url')
var cannedUtils = require('./lib/utils')
var lookup = require('./lib/lookup')

function Canned(dir, options) {
  this.logger = options.logger
  this.wildcard = options.wildcard
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
  var escapedQueryString = cannedUtils.escapeRegexSpecialChars(queryString)
  return matchString.match(
    new RegExp(fname +
               "(?=.*" +
               escapedQueryString.split("&").join(")(?=.*") +
               ").+" +
               method)
  )
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


Canned.prototype.parseMetaData = function(response) {
  var metaData = {}
  var lines = response.split("\n")
  var that = this

  var optionsMatch = new RegExp(/\/\/!.*[statusCode|contentType]/g)
  var requestMatch = new RegExp(/\/\/! [body|params|header]+: ([\w {}":,@.]*)/g)

  lines.forEach(function(line) {
    if(line.indexOf("//!") === 0) { // special comment line
      var matchedRequest = requestMatch.exec(line)
      if(matchedRequest) {
        metaData.request = JSON.parse(matchedRequest[1])
        return
      }
      var matchedOptions = optionsMatch.exec(line)
      if(matchedOptions) {
        try {
          line = line.replace("//!", '')
          var content = line.split(',').map(function (s) {
            var parts = s.split(':');
            parts[0] = '"' + parts[0].trim() + '"'
            return parts.join(':')
          }).join(',')
          var opts = JSON.parse('{' + content  + '}')
          cannedUtils.extend(metaData, opts)
        } catch(e) {
          that._log('Invalid file header format try //! statusCode: 201')
        }
        return
      }
    }
  })

  return metaData
}

Canned.prototype.getSelectedResponse = function(responses, content, headers) {
  var that = this
  var response = responses[0]
  var metaData = that.parseMetaData(response)
  var selectedResponse = {
    data: cannedUtils.removeSpecialComments(response),
    statusCode: metaData.statusCode || 200,
    contentType: metaData.contentType
  }

  responses.forEach(function(response) {
    var metaData = that.parseMetaData(response)
    var variation = cannedUtils.extend({}, content, headers)

    if(typeof metaData.request !== 'object') return; // nothing to match on

    Object.keys(metaData.request).forEach(function(key) {
      if(metaData.request[key] === variation[key])  {
        selectedResponse.data = cannedUtils.removeSpecialComments(response)
        if(metaData.statusCode) selectedResponse.statusCode = metaData.statusCode
      }
    })
  })

  return selectedResponse
}

// return multiple response bodies as array
Canned.prototype.getEachResponse = function(data) {
  data = cannedUtils.removeJSLikeComments(data)
  var responses = data.split(/\n\n(?=[\/\/!])/).filter(function (e) { return e !== '' })
  return responses
}

Canned.prototype.getVariableResponse = function(data, content, headers) {
  if(!data.length) {
    return { statusCode: 204, data: '' }
  }

  var responses = this.getEachResponse(data)
  var response = this.getSelectedResponse(responses, content, headers)
  return response
}

Canned.prototype.sanatizeContent = function (data, fileObject) {
  var sanatized

  if (data.length === 0) {
    return data
  }

  switch (fileObject.mimetype) {
  case 'json':
    // make sure we return valid JSON even so we support comments
    try {
      sanatized = JSON.stringify(JSON.parse(cannedUtils.removeJSLikeComments(data)))
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
        var _data = that.getVariableResponse(data, httpObj.content, httpObj.headers)
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

Canned.prototype.respondWithDir = function (httpObj, cb) {
  var that = this;

  var fpath = httpObj.path + '/' + httpObj.dname
  fs.readdir(fpath, function (err, files) {
    httpObj.fname = 'index'
    httpObj.path  = fpath
    that._responseForFile(httpObj, files, function (err, resp) {
      return cb(err, resp)
    })
  })
}

Canned.prototype.respondWithAny = function (httpObj, files, cb) {
  var that = this;

  httpObj.fname = 'any';
  that._responseForFile(httpObj, files, function (err, resp) {
    return cb(err, resp);
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

  var paths = lookup.getPaths(httpObj.pathname.join('/'), that.wildcard);
  paths.splice(0,1); // The first path is the default

  // Find a response for the first path
  that.findResponse(httpObj, responseHandler);

  function responseHandler(err, resp) {
    if (err) {
      // Try more paths, if there are any still
      if (paths.length > 0) {
        httpObj.path = that.dir + paths.splice(0, 1)[0];
        return that.findResponse(httpObj, responseHandler);
      } else {
        that._log(' not found\n');
      }
    } else {
      that._logHTTPObject(httpObj)
    }
    return resp.send();
  }
}

Canned.prototype.findResponse = function(httpObj, cb) {
  var that = this;
  fs.readdir(httpObj.path, function (err, files) {
    fs.stat(httpObj.path + '/' + httpObj.dname, function (err, stats) {
      if (err) {
        that._responseForFile(httpObj, files, function (err, resp) {
          if (err) {
            that.respondWithAny(httpObj, files, cb);
          } else {
            return cb(null, resp);
          }
        })
      } else {
        if (stats.isDirectory()) {
          that.respondWithDir(httpObj, cb);
        } else {
          return cb(null, new Response('html', '', 500, httpObj.res));
        }
      }
    })
  })
}

Canned.prototype.responseFilter = function (req, res) {
  var that = this
  var body = ''

  // assemble response body if GET/POST/PUT
  switch(req.method) {
  case 'PUT':
  case 'POST':
    req.on('data', function (data) {
      body += data
    })
    req.on('end', function () {
      var responderBody = querystring.parse(body);
      if (req.headers && req.headers['content-type'] === 'application/json') {
        try {
          responderBody = JSON.parse(body)
        } catch (e) {
          that._log('Invalid json content')
        }
      }
      that.responder(responderBody, req, res)
    })
    break
  case 'GET':
    var query = url.parse(req.url).query
    if (query && query.length > 0) {
      body = querystring.parse(query)
    }
    that.responder(body, req, res)
    break
  default:
    that.responder(body, req, res)
    break
  }
}

var canned = function (dir, options) {
  if (!options) options = {}
  dir = path.relative(process.cwd(), dir)
  var c = new Canned(dir, options)
  return c.responseFilter.bind(c)
}

module.exports = canned


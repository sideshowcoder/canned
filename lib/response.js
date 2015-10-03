"use strict";
var fs = require('fs')

function Response(content_type, content, statusCode, res, options, custom_headers) {
  this.cors_enabled = !!options.cors_enabled
  this.cors_headers = options.cors_headers
  this.configured_headers = options.configured_headers || []
  this.content_type = content_type
  this.content = content
  this.statusCode = statusCode
  this.res = res
  this.custom_headers = custom_headers || []
}

Response.content_types = {
  'json': 'application/json',
  'html': 'text/html',
  'txt': 'text/plain',
  'js': 'application/javascript'
}

Response.cors_headers = [
  ['Access-Control-Allow-Origin', '*'],
  ['Access-Control-Allow-Headers', 'X-Requested-With'],
  ['Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS']
]

Response.prototype.send = function () {
  this.headers().forEach(function (header) {
    this.res.setHeader(header[0], header[1])
  }, this)
  this.res.statusCode = this.statusCode
  this.res.end(this.content)
}

Response.prototype.headers = function () {
  var headers = {}
  headers = this._addContentTypeHeaders(headers)
  headers = this._addCORSHeaders(headers)
  headers = this._addCustomHeaders(headers)
  headers = this._addConfiguredHeaders(headers)
  return Object.keys(headers).map(function(key){
    return [key, headers[key]]
  })

}

Response.prototype._addContentTypeHeaders = function (headers) {
  if (this.content_type) {
    headers['Content-Type'] = this.content_type
  }
  return headers
}

Response.prototype._addCORSHeaders = function (headers) {
  var that = this;
  if (this.cors_enabled) {
    Response.cors_headers.forEach(function (h) {
      var key = h[0]
      if (!!that.cors_headers && h[0] === 'Access-Control-Allow-Headers')
        headers[key] = h[1] + ", " + that.cors_headers
      else
        headers[key] = h[1]
    })
  }
  return headers
}

Response.prototype._addCustomHeaders = function (headers) {
  this.custom_headers.forEach(function (header) {
    var key = Object.keys(header)[0]
    headers[key] = header[key]
  })
  return headers
}

Response.prototype._addConfiguredHeaders = function (headers) {
  var configured_headers = this.configured_headers
  Object.keys(configured_headers).forEach(function (key) {
    headers[key] = configured_headers[key]
  })
  return headers
}

module.exports = Response

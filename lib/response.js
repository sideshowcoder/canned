"use strict";
var fs = require('fs')

function Response(content_type, content, statusCode, res, options) {
  this.cors_enabled = !!options.cors_enabled
  this.cors_headers = options.cors_headers
  this.content_type = content_type
  this.content = content
  this.statusCode = statusCode
  this.res = res
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
  var headers = []
  headers = this._addContentTypeHeaders(headers)
  headers = this._addCORSHeaders(headers)
  return headers
}

Response.prototype._addContentTypeHeaders = function (headers) {
  if (this.content_type) {
    headers.push(['Content-Type', Response.content_types[this.content_type]])
  }
  return headers
}

Response.prototype._addCORSHeaders = function (headers) {
  var that = this;
  if (this.cors_enabled) {
    Response.cors_headers.forEach(function (h) {
      if (!!that.cors_headers && h[0] === 'Access-Control-Allow-Headers')
        headers.push([h[0], h[1] + ", " + that.cors_headers])
      else
        headers.push(h)
    })
  }
  return headers
}


module.exports = Response

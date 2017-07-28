"use strict";
var fs = require('fs')

function Response(content_type, content, statusCode, res, options, custom_headers) {
  this.cors_enabled = !!options.cors_enabled
  this.cors_headers = options.cors_headers
  this.access_control_allow_credentials = options.access_control_allow_credentials || 'false'
  this.access_control_allow_headers = options.access_control_allow_headers || 'X-Requested-With'
  this.access_control_allow_origin = options.access_control_allow_origin || '*'
  this.response_delay = options.response_delay
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

Response.prototype.send = function () {
  this.headers().forEach(function (header) {
    this.res.setHeader(header[0], header[1])
  }, this)
  this.res.statusCode = this.statusCode

  setTimeout(this.res.end.bind(this.res, this.content), this.response_delay)
}

Response.prototype.headers = function () {
  var headers = []
  headers = this._addContentTypeHeaders(headers)
  headers = this._addCORSHeaders(headers)
  headers = this._addCustomHeaders(headers)
  return headers
}

Response.prototype._addContentTypeHeaders = function (headers) {
  if (this.content_type) {
    headers.push(['Content-Type', this.content_type])
  }
  return headers
}

Response.prototype._addCORSHeaders = function (headers) {
  var that = this;
  if (this.cors_enabled) {
    headers.push(['Access-Control-Allow-Credentials', that.access_control_allow_credentials])
    if (!!that.cors_headers) {
      headers.push(['Access-Control-Allow-Headers', that.access_control_allow_headers + ", " + that.cors_headers])
    } else {
      headers.push(['Access-Control-Allow-Headers', that.access_control_allow_headers])
    }
    headers.push(['Access-Control-Allow-Origin', that.access_control_allow_origin])
    headers.push(['Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS'])
  }
  return headers
}

Response.prototype._addCustomHeaders = function (headers) {
  this.custom_headers.forEach(function(header) {
    var key = Object.keys(header)[0]
    headers.push([key, header[key]])
  })
  return headers
}

module.exports = Response

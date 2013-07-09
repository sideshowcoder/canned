var fs = require('fs')

Response.content_types = {
  'json': 'application/json',
  'html': 'text/html',
  'txt': 'text/plain',
  'js': 'application/javascript'
}

Response.cors_headers = [
  ['Access-Control-Allow-Origin', '*'],
  ['Access-Control-Allow-Headers', 'X-Requested-With'],
]

function Response(content_type, options) {
  this.cors_enabled = !!options.cors_enabled
  this.content_type = content_type
}

Response.prototype.headers = function() {
  var headers = []
  headers = this._addContentTypeHeaders(headers)
  headers = this._addCORSHeaders(headers)
  return headers
}

Response.prototype._addContentTypeHeaders = function(headers) {
  if (this.content_type) {
    headers.push(['Content-Type', Response.content_types[this.content_type]])
  }
  return headers
}

Response.prototype._addCORSHeaders = function(headers) {
  if (this.cors_enabled) {
    Response.cors_headers.forEach(function(h) { headers.push(h) })
  }
  return headers
}


module.exports = Response

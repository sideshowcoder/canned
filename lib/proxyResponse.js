"use strict";
var fs = require('fs')
var request = require('request');
var url = require('url');

function buildProxyUrl(originalUrl, proxy) {
  var parsedurl = url.parse(originalUrl), proxyUrl;
  proxyUrl = proxy + 
                  (parsedurl.path || '') + 
                  (parsedurl.query || '')+ 
                  (parsedurl.hash || '');
  return proxyUrl;

}

function ProxyResponse(proxy, req, res, errorHandler) {
  var that = this;
  that.proxyUrl = buildProxyUrl(req.url, proxy);
  that.req = req;
  that.res = res;
  that.errorHandler = errorHandler;
}

ProxyResponse.prototype.send = function () {
  var that = this;
  var proxy = request(that.proxyUrl);
  that.req.pipe(proxy)
    .on('error', function(err) {
      that.errorHandler()
    })
    .pipe(that.res);
}

module.exports = ProxyResponse

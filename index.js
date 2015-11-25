"use strict";

var path = require('path')
var Canned = require('./lib/canned')

var canned = function (dir, options) {
  if (!options) options = {}
  dir = path.relative(process.cwd(), dir)
  var c = new Canned(dir, options)
  return c.responseFilter.bind(c)
}

module.exports = canned


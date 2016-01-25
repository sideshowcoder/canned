"use strict";

var _ = require('lodash')

var utils = module.exports = {}

utils.escapeRegexSpecialChars = function (text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}

utils.extend = function (target) {
  var sources = [].slice.call(arguments, 1);
  sources.forEach(function (source) {
    for (var prop in source) {
      if(source.hasOwnProperty(prop)){
        target[prop] = source[prop]
      }
    }
  })
  return target
}

/**
 * recursively merge an object onto target, preserving existing keys.
 * Modified from http://stackoverflow.com/a/383245/771564
 */
utils.recursiveMerge = function(target, other) {
  if (!other) {
    return target;
  }

  for (var prop in other) {
    try {
      // Property in destination targetect set; update its value.
      if ( other[prop].constructor == Object ) {
        target[prop] = utils.recursiveMerge(target[prop], other[prop]);
      } else {
        target[prop] = other[prop];
      }
    } catch(e) {
      // Property in destination targetect not set; create it and set its value.
      target[prop] = other[prop];
    }
  }
  return target;
}

utils.removeJSLikeComments = function (text) {
  return text.replace(/\/\*.+?\*\/|\/\/\s.*(?=[\n\r])/g, '')
}

utils.removeSpecialComments = function (data) {
  return data.split("\n").filter(function(line) {
    return line.indexOf("//!") !== 0
  }).join("\n").trim()
}

utils.stringifyValues = function(object) {
  _.each(object, function(value, key) {
    if (typeof value === "object") {
      utils.stringifyValues(value);
    } else {
      object[key] = String(value)
    }
  })
}

"use strict";

var utils = module.exports = {}

utils.escapeRegexSpecialChars = function (text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}

utils.extend = function (target) {
  var sources = [].slice.call(arguments, 1);
  sources.forEach(function (source) {
    for (var prop in source) {
      if(Object.hasOwnProperty.call(source, prop)){
        target[prop] = source[prop]
      }
    }
  })
  return target
}

utils.removeJSLikeComments = function (text) {
  return text.replace(/\/\*.+?\*\/|\/\/\s.*(?=[\n\r])/g, '')
}

utils.removeSpecialComments = function (data) {
  return data.split("\n").filter(function(line) {
    return line.indexOf("//!") !== 0
  }).join("\n").trim()
}

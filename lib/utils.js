"use strict";

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

utils.removeJSLikeComments = function (text) {
  return text.replace(/\/\*.+?\*\/|\/\/\s.*(?=[\n\r])/g, '')
}

// replace any body comments in format //! [string]
utils.stripBodyComments = function(data) {
  return data && data.replace(/\/\/\! [\w]*: ([\w {}":,@./]*)/, '').trim()
}
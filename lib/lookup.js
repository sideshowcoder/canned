"use strict";


/***
 * Given a path and a wildcard string, return a list of paths
 * with every combination possible resulting from t he replacement of
 * any integer id found in the path with the wildcard string.
 *
 * The resulting list of paths is ordered by more "specific" to more
 * "generic" paths, for example using a wildcard of 'any' for the path:
 *
 *     api/2/customer/123/invoice/321/
 *
 * will return:
 *
 * [
 *   '/api/2/customer/123/invoice/321/',
 *   '/api/2/customer/123/invoice/any/',
 *   '/api/2/customer/any/invoice/321/',
 *   '/api/2/customer/any/invoice/any/',
 *   '/api/any/customer/123/invoice/321/',
 *   '/api/any/customer/123/invoice/any/',
 *   '/api/any/customer/any/invoice/321/',
 *   '/api/any/customer/any/invoice/any/'
 * ]
 *
 * @param path - the original path
 * @param wildcard - the replacmeent string
 * @returns {Array} - the resulting combination, ordered by specificity
 */

var lookup = module.exports = function (path, wildcard) {

  // Split the path and calculate how many paths will be generated
  var parts = path.split('/')
  var matches = path.match(/\/\d+(\/|$)/gi)
  var i

  if (!matches){
    return [path]
  }

  var lookPathsParts = [];

  // Locate replaceable parts indexes
  var matchesIndexes = []
  parts.forEach(function (p, i) {
    if (p.match(/^\d+$/)) {
      matchesIndexes.push(i)
    }
  })

  // Copy the original parts as a starting point for the new parts
  for (i = 0; i < Math.pow(2, matches.length); i++) {
    lookPathsParts.push(parts.slice())
  }

  // Generate the new paths parts
  for (i = matches.length; i > 0; --i) {
    var skip = Math.pow(2, i) / 2
    var replacePartIndex = matches.length - i
    for (var j = skip; j < lookPathsParts.length; j += (skip * 2)) {
      for (var k = 0; k < skip; k++) {
        lookPathsParts[j + k][matchesIndexes[replacePartIndex]] = wildcard
      }
    }
  }

  // Build the final path strings
  var lookPaths = []
  lookPathsParts.forEach(function (p) {
    lookPaths.push(p.join('/'))
  })
  return lookPaths
}

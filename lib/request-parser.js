var cannedUtils = require('./utils');
var requestMatch = /\/\/!.*(?:body|params|header):\s+([\w {}":\[\]\-\+\%,@.\/]*)/g;

var RequestParser = function() {}

function parseRequestOptions(line) {
    var match,
        requestItems = {};

    while (match = requestMatch.exec(line)) {
        try {
            cannedUtils.recursiveMerge(requestItems, JSON.parse(match[1]));
        } catch (e) {
            console.log(e);
            //@todo some logging
        }
    }

    return requestItems;
}

function parseEntry(lines) {
    var result = {};
    lines.split('\n').forEach(function(line) {
        cannedUtils.recursiveMerge(result, parseRequestOptions(line));
    });
    return result;
}

RequestParser.prototype.parse = parseRequestOptions;
RequestParser.prototype.parseEntry = parseEntry;

module.exports = RequestParser;

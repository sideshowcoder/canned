var cannedUtils = require('./utils');

var responseMatch = /\/\/!.*(?:statusCode|contentType|customHeaders)/g;

/**
 * the ResponseParser is responsible for collecting the intended return
 * status code, content type and header declarations.
 */
function ResponseParser() {}

/**
 * _parseresponse takes a single line from a file and extracts
 * JSON data if possible. Returns an object.
 */
function parseLine(line) {
    var match,
        response = {};

    while (responseMatch.exec(line)) {
        try {
            // drop the magix comment
            line = line.replace("//!", '').trim();

            var content = line.split(',').map(function (s) {
                var parts = s.split(':');
                if (parts[0].trim()[-1] !== '"') {
                    parts[0] = '"' + parts[0].trim() + '"'
                }
                return parts.join(':')
            }).join(',')

            response = cannedUtils.recursiveMerge(response, JSON.parse('{' + content  + '}'))
        } catch(e) {
            console.log(e);
            //@todo pass in log and get cracking
        }
    }

    return response;
}

function parseEntry(lines) {
    var result = {};
    lines.split('\n').forEach(function(line) {
        cannedUtils.recursiveMerge(result, parseLine(line));
    });
    return result;
}

ResponseParser.prototype.parse = parseLine;
ResponseParser.prototype.parseEntry = parseEntry;

module.exports = ResponseParser;

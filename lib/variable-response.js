"use strict";

var cannedUtils = require('./utils')

var VariableResponseParser = function(){};

// return multiple response bodies as array
VariableResponseParser.prototype.getEachResponse = function(data) {
  var lines = data.split('\n');
  var responses = [];
  var current = [];
  
  var line;
  current.push(lines[0]);
  for(var i=1, len=lines.length; i<len; i++){
    line=lines[i]
    if (line.substring(0, 3) === '//!'){
      responses.push( current.join('\n') )
      current = [];
    } 
    current.push(line); 
  }
  if(current.length > 0){
    responses.push(current.join('\n'))
  }

  return responses

}

VariableResponseParser.prototype.getSelectedResponse = function(responses, content, headers) {
  var selectedResponse = responses[0]

  if(!(content || headers)) return selectedResponse // noting to select on

  // find request matches and assign to chosenResponse
  responses.forEach(function(response) {
    var regex = new RegExp(/\/\/\! [A-z]*: ([\w {}":,@.]*)/g)
    var request = JSON.parse(regex.exec(response)[1])
    var variation = cannedUtils.extend({}, content, headers)

    if(typeof request !== 'object') return; // nothing to match on

    Object.keys(request).forEach(function(key) {
      if(request[key] === variation[key])  {
        selectedResponse = response
      }
    })
  })

  return selectedResponse
}

VariableResponseParser.prototype.getVariableResponse = function(data, content, headers) {
  // return sanatized data if no conditional body comments
  if(!data.match(/\/\/\! [\w]*: {.*}/)) {
    return JSON.stringify(cannedUtils.stripBodyComments(data))
  }

  var responses = this.getEachResponse(data)
  var selectedResponse = cannedUtils.stripBodyComments(this.getSelectedResponse(responses, content, headers))

  return JSON.stringify(selectedResponse)
}

module.exports = new VariableResponseParser();
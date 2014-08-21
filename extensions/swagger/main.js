var url = require("url")
var path = require("path")
var fs = require("fs")
var async = require("async")
var express = require("express")

// Constants
var APIURL = "/api-docs"
var DEFAULT_ENDPOINT = '/swagger'

var DESCRIPTION_TEMPLATE = {
  apiVersion:"1.0.0",
  swaggerVersion:"1.2",
  apis:null,
  info:{
    title:"Canned API emulator",
    description:"",
    termsOfServiceUrl:"http://helloreverb.com/terms/",
    contact:"philipp@couchbase.com",
    license:"MIT 2013 Philipp Fehre alias @sideshowcoder, or @ischi on twitter",
    licenseUrl:"http://opensource.org/licenses/MIT"
  }
}

var ITEM_TEMPLATE = {
  apiVersion:"1.0.0",
  swaggerVersion:"1.2",
  basePath:null,
  resourcePath:null,
  produces: ["application/json"],
  apis: null
}

var createPath = function (path) {
  return {
    path: path,
    operations: []
  }
}

var createMethod = function (method) {
  return {
    "method": method,
    "summary": "",
    "notes": "",
    "nickname": "placeOrder"
  }
}

var processFolder = function (folder, req, res) {
  ITEM_TEMPLATE.basePath = 'http://' + req.headers.host;
  ITEM_TEMPLATE.resourcePath = folder;

  fs.readdir(this.dir + folder, function(err, files){
    var apis = {}
    files.forEach(function(file){
      var parts = file.split('.')
      var name = parts[0]
      var method = parts[1]
      var path = folder + '/'
      
      if(name === 'any'){
        path += '{ID}'
      }else if(name !== 'index'){
        name = name.substr(1)
        path += name
      }

      if(typeof apis[path] === 'undefined'){
        apis[path] = createPath(path)
      }

      apis[path].operations.push(createMethod(method.toUpperCase()))
    })

    ITEM_TEMPLATE.apis = Object.keys(apis).map(function(key){
      return apis[key]
    })

    res.writeHead(200, {'Content-Type': 'application/json'})
    res.end(JSON.stringify(ITEM_TEMPLATE))
  });
}

var processPoint = function (req, res){
  var that = this

  var resp = function () {
    res.writeHead(200, {'Content-Type': 'application/json'})
    res.end(JSON.stringify(DESCRIPTION_TEMPLATE))
  }

  if(DESCRIPTION_TEMPLATE.apis !== null){
    resp()
  }else{
    fs.readdir(that.dir, function(err, files){
      if (err) return console.log(err);
      async.map(
        files,
        function(file, cb){
          fs.stat(that.dir + '/' + file, cb);
        }, function(err, stats){

          var dirs = files.filter(function(file){
            return stats[files.indexOf(file)].isDirectory()
          })
          var apis = dirs.map(function(dir){
            return {"path":"/"+dir,"description":"Operations about "+dir}
          })

          DESCRIPTION_TEMPLATE.apis = apis;

          resp()
        }
      )
    })
  }
}

var api = function (req, res) {
  var path = url.parse(req.url).pathname

  if(path === "/"){
    processPoint.call(this, req, res)
  }else{
    processFolder.call(this, path, req, res)
  }
}

module.exports = exports = function(options){
  if(options.dir){
    this.dir = options.dir
  }else{
    return null
  }

  if(options.argv && options.argv.swaggerEndpoint){
    this.endpoint = '/' + options.argv.swaggerEndpoint
  }else{
    this.endpoint = DEFAULT_ENDPOINT
  }

  options.app.use(this.endpoint, express.static(__dirname + '/static'));
  options.app.use(this.endpoint + APIURL,api.bind(this))
}

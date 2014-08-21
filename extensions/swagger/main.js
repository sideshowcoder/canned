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

var processFolder = function (folder, req, res, next) {
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
    next(true)
  });
}

var processPoint = function (req, res, next){
  var that = this

  var resp = function () {
    res.writeHead(200, {'Content-Type': 'application/json'})
    res.end(JSON.stringify(DESCRIPTION_TEMPLATE))
    next(true)
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

var api = function (req, res, next) {
  var path = url
    .parse(req.url)
    .pathname
    .replace(this.endpoint + APIURL,'')

  if(path === ""){
    processPoint.call(this, req, res, next)
  }else{
    processFolder.call(this, path, req, res, next)
  }
}

var main = function (req, res, next) {
  var path = url.parse(req.url).path

  if(path.indexOf(this.endpoint + APIURL) !== -1){
    api.apply(this, arguments)
  }else if(path.indexOf(this.endpoint) !== -1){
    static.apply(this, arguments)
  }else{
    next(null)
  }
}

var static = function (request, response, next) {
  var uri = url.parse(request.url).pathname.replace(this.endpoint,'')
  , filename = path.join(__dirname + '/static', uri)
  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }
    
    if (fs.statSync(filename).isDirectory()) filename += '/index.html';
    
    fs.readFile(filename, "binary", function(err, file) {
      if(err) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }
      
      response.writeHead(200);
      response.write(file, "binary");
      response.end();
      next(true)
    });
  });
}

module.exports = exports = function(options){
  var obj = {}
  if(options.dir){
    obj.dir = options.dir
  }else{
    return null
  }

  if(options.argv && options.argv.swaggerEndpoint){
    obj.endpoint = '/' + options.argv.swaggerEndpoint
  }else{
    obj.endpoint = DEFAULT_ENDPOINT
  }

  return main.bind(obj)
}

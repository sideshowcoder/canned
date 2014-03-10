"use strict";

var _ = require('lodash');
var express = require('express');
var argsParser = require('args-js');
var defaultPort = 3000;

function serve(dir){
  return require('./lib/parser')(dir);
}

function Canned(dir, opts){
  this._dir = dir;
  this._opts = _.defaults(opts, {
    prefix : '',
    port   : defaultPort
  });
  console.log(this._opts);
}

Canned.prototype.listen = function(port, app){
  var args = argsParser([
    {port : argsParser.INT | argsParser.Optional, _default : this._opts.port},
    {app : argsParser.OBJECT | argsParser.Optional}
  ], arguments);
  this._opts.port = args.port;
  var server = this._server = args.app || express();
  server.use(express.logger());
  server.use(this._opts.prefix, serve(this._dir));
  server.listen(args.port);
};

function createCanned(dir, opts){
  var canned = new Canned(dir, opts);
  canned.listen();
  return canned;
}

createCanned.serve = serve;
createCanned.defaultPort = defaultPort;
module.exports = createCanned;
"use strict";

var _ = require('lodash');
var express = require('express');
var Args = require('args-js');

function serve(dir){
	return require('./lib/parser')(dir);
};

function Canned(dir, opts){
	this._dir = dir;
	this._opts = _.defaults({
		prefix : ''
	}, opts);
};

Canned.prototype.listen = function(port, app){
	var args = Args([
		{port : Args.INT | Args.Optional, _default : 3000},
		{app : Args.OBJECT | Args.Optional}
	], arguments);
	var server = this._server = args.app || express();
	server.use(express.logger());
	server.use(this._opts.prefix, serve(this._dir));
	server.listen(args.port);
};

function createCanned(dir, opts){
	var canned = new Canned(dir, opts);
	canned.listen();
	return canned;
};

createCanned.serve = serve;
module.exports = createCanned;
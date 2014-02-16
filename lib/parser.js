var url = require('url');
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var mime = require('mime');

function mapDir(map, absPath){
	fs.readdirSync(absPath).forEach(function(filename){
		if("." !== filename[0]){ //filter hidden files
			var filepath = [absPath, filename].join('/');
			if(fs.statSync(filepath).isDirectory()){
				mapDir(map, filepath);
			}else{
				var fileID = [absPath, path.basename(filename, path.extname(filename))].join('/');
				map[fileID] = filepath;
			}
		}
	});
};

function mapURL(fileURL, method){
	var parsedurl = url.parse(fileURL);
	var queries = [];
	if(parsedurl.path !== parsedurl.pathname){
		queries.push([parsedurl.path, method].join('/'));
		queries.push(parsedurl.path);
	}
	var parts = parsedurl.pathname.split('/');
	while(parts.length > 0){
		var dir = parts.join('/');
		queries.push([dir, method].join('/'));
		queries.push(dir);
		parts.pop();
	}
	return queries;
}

function Parser(dir, app){
	this._dir = path.resolve(dir);
	this._app = app;
	this.init();
};

Parser.prototype.init = function(){
	this._map = {};
	mapDir(this._map, this._dir);
}

Parser.prototype.parseRequest = function(req, res, next){
	var queries = mapURL(req.url, req.method);
	var matched = _.find(queries, function(query){
		return this._map.hasOwnProperty(this._dir + query);
	}, this);
	if(matched){
		var filepath = this._map[this._dir + matched];
		var filecontent;
		if('.js' === path.extname(filepath)){
			filecontent = require(filepath)(this._app);
		}else{
			filecontent = fs.readFileSync(filepath, {
				encoding : "utf-8"
			});
		}
		var pattern = /\/\*headers([^*]*)\*\//m;
		var rawHeaders = pattern.exec(filecontent);
		if(rawHeaders){
			try{
				var headers = JSON.parse(rawHeaders[1]);
				res.header(headers);
				filecontent = filecontent.replace(pattern, ''); //strip headers from file
			}catch(e){
				throw (e);
			}
		}
		var contentType = res.get('Content-Type');
		if(!contentType){
			contentType = mime.lookup(filepath);
			res.set('Content-Type', contentType);
		}
		if(contentType.indexOf('json') > -1){
			filecontent = JSON.parse(filecontent);
		}
		res.send(200, filecontent);
	}else{
		next();
	}
};

module.exports = function createParser(dir, app){
	var parser = new Parser(dir, app);
	return parser.parseRequest.bind(parser);
};
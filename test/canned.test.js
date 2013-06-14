var tap = require('tap')
,   test = tap.test
,   canned = require('../canned')
,   fs = require('fs')

test('canned actually loads', function(t){
  t.ok(canned, 'canned loaded successfully')
  t.end()
})

test('create fake api', function(t){
  var can = canned('./test_responses', { logger: process.stderr })
  ,   req = { method: 'GET' }
  ,   res = { setHeader: function(){}, end: function(){} }

  t.type(can, 'function', 'canned fake api creates success')

  t.test('returns status 404 if _na.get does not exist for /na', function(t){
    t.plan(1)
    req.url = '/na'
    res.end = function(){
      t.equal(res.statusCode, 404, 'set error status')
    }
    can(req, res)
  })

  t.test('returns status 200 if _a.get.json does exist for /a', function(t){
    t.plan(1)
    req.url = '/a'
    res.end = function(){
      t.equal(res.statusCode, 200, 'set ok status')
    }
    can(req, res)
  })

  t.test('sets application/txt as content-type if _b.get.txt does exist for /b', function(t){
    t.plan(1)
    req.url = '/b'
    res.setHeader = function(_name, value){
      t.equal(value, 'text/plain', 'set content type txt')
    }
    can(req, res)
  })

  t.test('gets content-type json if index.get.html for /', function(t){
    t.plan(1)
    req.url = '/'
    res.setHeader = function(_name, value){
      t.equal(value, 'text/html', 'set content type html')
    }
    can(req, res)
  })

  t.test('gets content of index.get.json for /', function(t){
    t.plan(1)
    req.url = '/'
    res.end = function(content){
      t.equal(content, 'index.get.json\n', 'set the file content')
    }
    can(req, res)
  })

  t.test('gets _a.get.json for /a?abc=thegreatpubar ignoring the query params', function(t){
    t.plan(1)
    req.url = '/a?abc=thegreatpubar'
    res.end = function(content){
      t.equal(content, '_a.get.json\n', 'set the file content')
    }
    can(req, res)
  })

  t.test('gets content of index.get.json for /d', function(t){
    t.plan(1)
    req.url = '/d'
    res.end = function(content){
      t.equal(content, 'd/index.get.json\n', 'set the file content')
    }
    can(req, res)
  })

  t.test('gets content of any.get.json for /d/iamanid', function(t){
    t.plan(1)
    req.url = '/d/iamanid'
    res.end = function(content){
      t.equal(content, 'd/any.get.json\n', 'set the file content')
    }
    can(req, res)
  })

  t.test('removes the comments from .json so it is valid', function(t){
    t.plan(1)
    req.url = '/d/commented'
    res.end = function(content){
      t.equal(content, '{"no":"comments"}', 'removes comments')
    }
    can(req, res)
  })

  t.test('sets the necessary HEADER to allow CORS', function(t){
    t.plan(1)
    req.url = '/d/commented'
    req.method = 'OPTIONS'
    var header = {}
    header['Content-Type'] = "text/plain";
    header['Access-Control-Allow-Origin'] = "*";
    header['Access-Control-Allow-Methods'] = "GET, POST, PUT, DELETE, HEAD, OPTIONS";
    header['Access-Control-Allow-Headers'] = "X-Requested-With";
    header['Access-Control-Allow-Max-Age'] = "86400";

    res.setHeader = function(name, value){
      t.equal(value, header[name], 'Checking Header '+name);
    }
    can(req, res)
  })

  t.end()
})



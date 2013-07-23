var tap = require('tap')
var test = tap.test
var canned = require('../canned')
var fs = require('fs')

test('canned actually loads', function(t) {
  t.ok(canned, 'canned loaded successfully')
  t.end()
})

test('create fake api', function(t) {
  var can = canned('./test_responses', { logger: process.stderr })
  var req = { method: 'GET' }
  var res = { setHeader: function() {}, end: function() {} }


  t.type(can, 'function', 'canned fake api creates success')

  t.test('gets content of index.get.json for /', function(t) {
    t.plan(1)
    req.url = '/'
    res.end = function(content) {
      t.equal(content, 'index.get.json\n', 'set the file content')
    }
    can(req, res)
  })

  t.test('gets _a.get.json for /a?abc=thegreatpubar ignoring the query params', function(t) {
    t.plan(1)
    req.url = '/a?abc=thegreatpubar'
    res.end = function(content) {
      t.equal(content, '_a.get.json\n', 'set the file content')
    }
    can(req, res)
  })

  t.test('gets content of index.get.json for /d', function(t) {
    t.plan(1)
    req.url = '/d'
    res.end = function(content) {
      t.equal(content, 'd/index.get.json\n', 'set the file content')
    }
    can(req, res)
  })

  t.test('gets content of any.get.json for /d/iamanid', function(t) {
    t.plan(1)
    req.url = '/d/iamanid'
    res.end = function(content) {
      t.equal(content, 'd/any.get.json\n', 'set the file content')
    }
    can(req, res)
  })

  t.test('removes the comments from .json so it is valid', function(t) {
    t.plan(1)
    req.url = '/d/commented'
    res.end = function(content) {
      t.equal(content, '{"no":"comments"}', 'removes comments')
    }
    can(req, res)
  })

  t.test('nested folder request for not present folders should work', function(t) {
    t.plan(1)
    req.url = '/foo/bar/baz'
    res.end = function() {
      t.equal(res.statusCode, 404, 'set not status')
    }
    can(req, res)
  })

  t.test('CORS support', function(t) {
    var can = canned('./test_responses', { logger: process.stderr, cors: true })
    var req = { method: 'GET' }
    var res = { setHeader: function() {}, end: function() {} }

    t.test('sets the necessary HEADER to allow CORS', function(t) {
      t.plan(2)
      var req = { method: 'OPTIONS', url: '/' }
      var expected_headers = {
        'Access-Control-Allow-Origin': "*",
        'Access-Control-Allow-Headers': "X-Requested-With"
      }
      res.setHeader = function(name, value) {
        t.equal(value, expected_headers[name], 'Checking Header '+name)
      }
      can(req, res)
    })

    t.test('sets the necessary HEADER to allow CORS on GET', function(t) {
      t.plan(3)
      req.url = '/'
      var expected_headers = {
        'Content-Type': "text/html",
        'Access-Control-Allow-Origin': "*",
        'Access-Control-Allow-Headers': "X-Requested-With"
      }
      res.setHeader = function(name, value) {
        t.equal(value, expected_headers[name], 'Checking Header '+name)
      }
      can(req, res)
    })


    t.end()
  })

  t.end()
})



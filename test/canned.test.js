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

  t.test('removes the comments from .json so it is valid', function(t) {
    t.plan(1)
    req.url = '/d/commented'
    res.end = function(content) {
      t.equal(content, '{"no":"comments"}', 'removes comments')
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



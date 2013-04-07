var tap = require('tap')
,   test = tap.test
,   canned = require('../canned')

test('canned actually loads', function(t){
  t.ok(canned, 'canned loaded successfully')
  t.end()
})

test('create fake api', function(t){
  var can = canned('./test_responses')
  ,   req = { method: 'GET' }
  ,   res = { setHeader: function(){}, end: function(){} }

  t.type(can, 'function', 'canned fake api creates success')

  t.test('returns status 400 if _na.get does not exist for /na', function(t){
    t.plan(1)
    req.path = '/na'
    res.end = function(){
      t.equal(res.statusCode, 400, 'set error status')
    }
    can(req, res)
  })

  t.test('returns status 200 if _a.get.json does exist for /a', function(t){
    t.plan(1)
    req.path = '/a'
    res.end = function(){
      t.equal(res.statusCode, 200, 'set ok status')
    }
    can(req, res)
  })

  t.test('sets application/json as content-type if _a.get.json does exist for /a', function(t){
    t.plan(2)
    req.path = '/a'
    res.setHeader = function(name, value){
      t.equal(name, 'Content-Type', 'set content-type')
      t.equal(value, 'application/json', 'set application/json')
    }
    can(req, res)
  })

  t.test('sets application/txt as content-type if _b.get.txt does exist for /b', function(t){
    t.plan(1)
    req.path = '/b'
    res.setHeader = function(name, value){
      t.equal(value, 'application/txt', 'set content type txt')
    }
    can(req, res)
  })

  t.test('gets the content of index.get.json for /', { skip: true }, function(t){
    t.plan(1)
    req.path = '/'
    res.end = function(content){
      t.equal(content, 'index.get.json', 'get the content')
    }
    can(req, res)
  })

  t.end()
})





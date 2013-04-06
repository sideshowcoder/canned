var tap = require('tap')
,   test = tap.test
,   canned = require('../canned')

test('canned actually loads', function(t){
  t.ok(canned, 'canned loaded successfully')
  t.end()
})

test('create fake api', function(t){
  t.type(canned('../test_responses'), 'function', 'canned fake api creates success')
  t.end()
})







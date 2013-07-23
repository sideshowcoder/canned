var canned = require('../canned')

describe('canned', function() {

  var can, req, res
  beforeEach(function() {
    can = canned('./spec/test_responses')
    req = { method: 'GET' }
    res = { setHeader: function() {}, end: function() {} }
  })

  describe('status codes', function(){
    it('sets 404 for non resolveable request', function(done) {
      req.url = '/i_do_not_exist'
      res.end = function() {
        expect(res.statusCode).toBe(404)
        done()
      }
      can(req, res)
    })

    it('sets 200 for resolveable requests', function(done) {
      req.url = '/a'
      res.end = function() {
        expect(res.statusCode).toBe(200)
        done()
      }
      can(req, res)
    })

    it('sets 201 if specified in file', function(done) {
      req.url = '/201'
      res.end = function() {
        expect(res.statusCode).toBe(201)
        done()
      }
      can(req, res)
    })
  })
})

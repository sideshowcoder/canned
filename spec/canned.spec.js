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

  describe('content type', function() {
    it('sets text/plain for txt', function(done) {
      req.url = '/b'
      res.setHeader = function(name, value) {
        expect(value).toBe('text/plain')
        expect(name).toBe('Content-Type')
        done()
      }
      can(req, res)
    })

    it('sets text/html for errors', function(done) {
      req.url = '/i_do_not_exist'
      res.setHeader = function(name, value) {
        expect(value).toBe('text/html')
        expect(name).toBe('Content-Type')
        done()
      }
      can(req, res)
    })
  })

  describe('resolve file paths', function() {
    it('loads index for /')
    it('loads index for /d with d being a directory')
    it('loads any for /d/something')
    it('works for nested folder being not present')
  })

  describe('content modifier', function() {
    it('removes comments from json')
  })

  describe('CORS', function() {
    it('accepts the options verb')
    it('sets the headers')
  })
})

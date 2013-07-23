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
    it('loads index for /', function(done) {
      req.url = '/'
      res.end = function(content) {
        expect(content).toContain('index.get.json')
        done()
      }
      can(req, res)
    })

    it('loads index for /d with d being a directory', function(done) {
      req.url = '/d'
      res.end = function(content) {
        expect(content).toContain('d/index.get.json')
        done()
      }
      can(req, res)
    })

    it('loads any for /d/something', function(done) {
      req.url = '/d/i_am_an_id'
      res.end = function(content) {
        expect(content).toContain('d/any.get.json')
        done()
      }
      can(req, res)
    })

    it('ignores the query params', function(done) {
      req.url = '/a?foo=bar'
      res.end = function(content) {
        expect(content).toContain('_a.get.json')
        done()
      }
      can(req, res)
    })

    it('works for nested folder being not present', function(done) {
      req.url = '/foo/bar/baz'
      res.end = function() {
        expect(res.statusCode).toBe(404)
        done()
      }
      can(req, res)
    })
  })

  describe('content modifier', function() {
    it('removes comments from json')
  })

  describe('CORS', function() {
    it('accepts the options verb')
    it('sets the headers')
  })
})
